window.onload = function(){
    const menuToggle = document.getElementById('toggle');
    const showcase = document.getElementById('showcase');

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        showcase.classList.toggle('active');
    })
}