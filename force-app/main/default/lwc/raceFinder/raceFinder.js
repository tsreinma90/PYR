import { LightningElement, track } from 'lwc';
import searchRaces from '@salesforce/apex/RunSignupRaceService.searchRaces';
import suggestFilters from '@salesforce/apex/RaceFilterCoachController.suggestFilters';
import getZipFromCoords from '@salesforce/apex/GeoapifyService.getZipFromCoords';

const SERVER_SORT_FIELDS = ['name', 'city', 'state', 'created', 'modified'];

export default class RaceFinder extends LightningElement {
    @track zipcode = '';
    @track radiusMiles = 50;
    @track startDate;
    @track endDate;
    @track minDistance;
    @track maxDistance;
    @track distanceUnits = 'K'; // "K" or "M"
    @track keyword;

    @track races = [];
    @track isLoading = false;
    @track error;
    @track sortField = 'next_date_local';

    @track aiQuery = '';
    @track aiIsLoading = false;
    @track aiError;
    @track aiRecommendation;

    connectedCallback() {
        const today = new Date();
        const sixMonthsLater = new Date();
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

        this.startDate = today.toISOString().slice(0, 10);        // YYYY-MM-DD
        this.endDate = sixMonthsLater.toISOString().slice(0, 10); // YYYY-MM-DD
        this.distanceUnits = 'K';

        window.raceFinderCmp = this;

        // Optional: auto-attempt to populate ZIP from browser location on load.
        // If you prefer a button-only flow, comment this out and just use handleUseMyLocation().
        //this.tryPopulateZipFromLocation();
    }

    // ---- Location → ZIP via Geoapify ----

    tryPopulateZipFromLocation() {
        // Browser support check
        if (!navigator.geolocation) {
            // eslint-disable-next-line no-console
            console.warn('Geolocation is not supported by this browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;

                getZipFromCoords({ lat: latitude, lon: longitude })
                    .then((zip) => {
                        if (zip) {
                            this.zipcode = zip;

                            // Optional: immediately run search with detected ZIP
                            // this.handleSearch();
                        }
                    })
                    .catch((err) => {
                        // eslint-disable-next-line no-console
                        console.error('Error calling Geoapify Apex:', err);
                    });
            },
            (err) => {
                // User can deny or an error can occur; we just keep the default ZIP.
                // eslint-disable-next-line no-console
                console.warn('Geolocation error or permission denied:', err);
            }
        );
    }

    // Use this from your HTML for a "Use my location" button:
    // <button onclick={handleUseMyLocation}>Use my location</button>
    handleUseMyLocation() {
        this.tryPopulateZipFromLocation();
    }

    handleInputChange(event) {
        const field = event.target.name;

        // Comboboxes (and some other base components) use event.detail.value
        const value =
            event.detail && event.detail.value !== undefined
                ? event.detail.value
                : event.target.value;

        this[field] = value;

        // If the sort changed, re-apply local sorting
        if (field === 'sortField') {
            this.sortLocalResults();
        }
    }

    handleAiQueryChange(event) {
        this.aiQuery = event.target.value;
    }

    handleUnitsChange(event) {
        const newUnits = event.detail.value;
        const oldUnits = this.distanceUnits || 'K';

        if (newUnits === oldUnits) {
            return;
        }

        // Convert existing distances if they exist
        if (this.minDistance) {
            if (oldUnits === 'K' && newUnits === 'M') {
                this.minDistance = this.kmToMiles(this.minDistance);
            } else if (oldUnits === 'M' && newUnits === 'K') {
                this.minDistance = this.milesToKm(this.minDistance);
            }
        }

        if (this.maxDistance) {
            if (oldUnits === 'K' && newUnits === 'M') {
                this.maxDistance = this.kmToMiles(this.maxDistance);
            } else if (oldUnits === 'M' && newUnits === 'K') {
                this.maxDistance = this.milesToKm(this.maxDistance);
            }
        }

        this.distanceUnits = newUnits;
    }

    handleSearch() {
        this.isLoading = true;
        this.error = undefined;

        // Only send sortField to Apex if API actually supports it
        const serverSortField = SERVER_SORT_FIELDS.includes(this.sortField)
            ? this.sortField
            : null;

        searchRaces({
            zipcode: this.zipcode,
            radiusMiles: this.radiusMiles ? parseInt(this.radiusMiles, 10) : null,
            startDate: this.startDate || null,
            endDate: this.endDate || null,
            minDistance: this.minDistance ? parseFloat(this.minDistance) : null,
            maxDistance: this.maxDistance ? parseFloat(this.maxDistance) : null,
            distanceUnits: this.distanceUnits || 'K',
            keyword: this.keyword || null,
            sortField: serverSortField
        })
            .then(result => {
                this.races = result || [];
                this.sortLocalResults(); // apply client-side sort if needed
            })
            .catch(err => {
                this.races = [];
                this.error =
                    err && err.body && err.body.message
                        ? err.body.message
                        : (err && err.message) ? err.message : 'Unknown error';
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    handleOpenRace(event) {
        const url = event.target.dataset.url;
        if (url) {
            window.open(url, '_blank');
        }
    }

    get hasResults() {
        return this.races && this.races.length > 0;
    }

    get distanceUnitOptions() {
        return [
            { label: 'Kilometers', value: 'K' },
            { label: 'Miles', value: 'M' }
        ];
    }

    // ---- Quick distance presets ----

    set5k() {
        if (this.distanceUnits === 'K') {
            this.minDistance = 5;
            this.maxDistance = 5.2;
        } else {
            this.minDistance = this.kmToMiles(5);
            this.maxDistance = this.kmToMiles(5.2);
        }
    }

    set10k() {
        if (this.distanceUnits === 'K') {
            this.minDistance = 10;
            this.maxDistance = 10.5;
        } else {
            this.minDistance = this.kmToMiles(10);
            this.maxDistance = this.kmToMiles(10.5);
        }
    }

    setHalf() {
        if (this.distanceUnits === 'K') {
            this.minDistance = 20;
            this.maxDistance = 22.5;
        } else {
            this.minDistance = this.kmToMiles(20);
            this.maxDistance = this.kmToMiles(22.5);
        }
    }

    setMarathon() {
        if (this.distanceUnits === 'K') {
            this.minDistance = 40;
            this.maxDistance = 43.5;
        } else {
            this.minDistance = this.kmToMiles(40);
            this.maxDistance = this.kmToMiles(43.5);
        }
    }

    // ---- Unit conversions ----

    kmToMiles(km) {
        if (km == null || km === '') return null;
        const miles = parseFloat(km) * 0.621371;
        return parseFloat(miles.toFixed(2)); // 2 decimal places
    }

    milesToKm(miles) {
        if (miles == null || miles === '') return null;
        const km = parseFloat(miles) / 0.621371;
        return parseFloat(km.toFixed(2));
    }

    // ---- AI – Suggest Filters from Natural Language ----

    handleAskAiRecommendation() {
        // Require user text
        const prompt = this.aiQuery ? this.aiQuery.trim() : '';
        if (!prompt) {
            this.aiError = 'Describe the kind of race you’re looking for first.';
            this.aiRecommendation = undefined;
            return;
        }

        this.aiIsLoading = true;
        this.aiError = undefined;
        this.aiRecommendation = undefined;

        const req = {
            userPrompt: prompt
        };

        // Call Apex -> Agent
        suggestFilters({ req })
            .then((resp) => {
                if (!resp) {
                    this.aiError = 'No response was returned from the AI coach.';
                    return;
                }

                // 1) Show the human-friendly explanation in the Ask AI tab
                this.aiRecommendation = resp.summaryText;

                // 2) If we got machine-readable filters, apply them and run the search
                if (resp.filtersJson) {
                    try {
                        const filters = JSON.parse(resp.filtersJson);

                        if (filters.zipcode) {
                            this.zipcode = filters.zipcode;
                        }
                        if (filters.radiusMiles !== undefined && filters.radiusMiles !== null) {
                            this.radiusMiles = String(filters.radiusMiles);
                        }
                        if (filters.startDate) {
                            this.startDate = filters.startDate;
                        }
                        if (filters.endDate) {
                            this.endDate = filters.endDate;
                        }
                        if (filters.minDistanceKm !== undefined && filters.minDistanceKm !== null) {
                            this.minDistance = String(filters.minDistanceKm);
                        }
                        if (filters.maxDistanceKm !== undefined && filters.maxDistanceKm !== null) {
                            this.maxDistance = String(filters.maxDistanceKm);
                        }
                        if (filters.keywords) {
                            this.keyword = filters.keywords;
                        }

                        // Make sure units match what the JSON is using
                        // (we told the agent to use km; your UI is "K" for kilometers)
                        this.distanceUnits = 'K';

                        // 3) Kick off the actual search with these new filters
                        this.handleSearch();
                    } catch (e) {
                        // If filtersJson isn't valid JSON, just log it and
                        // keep the human explanation.
                        // eslint-disable-next-line no-console
                        console.error('Error parsing filtersJson', e, resp.filtersJson);
                    }
                }
            })
            .catch((error) => {
                let msg =
                    error && error.body && error.body.message
                        ? error.body.message
                        : error && error.message
                            ? error.message
                            : 'Unknown error calling the AI coach.';
                this.aiError = msg;
            })
            .finally(() => {
                this.aiIsLoading = false;
            });
    }

    // ---- Sorting ----

    get sortOptions() {
        return [
            { label: 'Race Date (soonest first)', value: 'next_date_local' }, // LWC-only
            { label: 'Name (A → Z)', value: 'name' },
            { label: 'City (A → Z)', value: 'city' },
            { label: 'State (A → Z)', value: 'state' },
            { label: 'Recently Added', value: 'created' }
        ];
    }

    sortLocalResults() {
        if (!this.races || this.races.length === 0) {
            return;
        }

        const sorted = [...this.races];

        switch (this.sortField) {
            case 'next_date_local':
                sorted.sort((a, b) => {
                    if (!a.nextDate && !b.nextDate) return 0;
                    if (!a.nextDate) return 1;
                    if (!b.nextDate) return -1;
                    return new Date(a.nextDate) - new Date(b.nextDate);
                });
                break;

            case 'name':
                sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;

            case 'city':
                sorted.sort((a, b) => (a.city || '').localeCompare(b.city || ''));
                break;

            case 'state':
                sorted.sort((a, b) => (a.state || '').localeCompare(b.state || ''));
                break;

            // "created" -> let server order stand; no local sort needed
            default:
                return; // don't reassign this.races
        }

        this.races = sorted;
    }
}