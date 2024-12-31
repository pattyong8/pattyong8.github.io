const scriptURL = 'https://script.google.com/macros/s/AKfycbzPL6GTai2ZzBSdKywBP16xMo2ywD1mI95okaAHEv3rXfK6Zj7Txw4uCBzu7x0XPyAQ/exec'
const form = document.forms['submit-to-google-sheet']
form.addEventListener('submit', e => {
  e.preventDefault()
  fetch(scriptURL, { method: 'POST', body: new FormData(form)})
    .then(response => console.log('Success!', response))
    .catch(error => console.error('Error!', error.message))
