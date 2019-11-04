// IMPORTS
import $ from 'jquery';
import './css/base.scss';
import Hotel from '../src/hotel';
import BookingsRepository from '../src/bookingsRepository';

// FETCH
let roomsFetchData = fetch('https://fe-apps.herokuapp.com/api/v1/overlook/1904/rooms/rooms')
.then(response => response.json());

let bookingsFetchData = fetch('https://fe-apps.herokuapp.com/api/v1/overlook/1904/bookings/bookings')
.then(response => response.json());

let guestsFetchData = fetch('https://fe-apps.herokuapp.com/api/v1/overlook/1904/users/users')
.then(response => response.json());

let roomsData;
let bookingsData;
let guestsData;
let bookingsRepository;
let hotel;
let guestId;

Promise.all([roomsFetchData, bookingsFetchData, guestsFetchData])
.then(data => {
  roomsData = data[0].rooms;
  bookingsData = data[1].bookings;
  guestsData = data[2].users;
})
.then(() => {
  bookingsRepository = new BookingsRepository(bookingsData);
  hotel = new Hotel(roomsData, bookingsRepository);
})
.then(() => {
  addManagerDataToDom();
  addGuestDataToDOM();
});
//.catch

//DOM MANIPULATION
let todayDate = getTodayDate();

function addManagerDataToDom() {
  $('#rooms-available').text(hotel.viewRoomsAvailable(todayDate).length);
  $('#percent-occupied').text(`${hotel.returnPercentRoomsOccupied(todayDate)}%`);
  $('#total-revenue').text(`$${hotel.returnTotalRevenue(todayDate)}`);
}

function addGuestDataToDOM() {
  guestId = parseInt(localStorage.getItem('guestId'));
  showBookings();
  $('#total-spent').text(`$${hotel.returnTotalSpent(guestId)}`);
  $('#reward-remainder').text(`$${10000 - hotel.returnTotalSpent(guestId)}`)
}

function showBookings() {
  $('#guest-booking-info').text('');
  let bookingDates = bookingsRepository.viewBookings(guestId).map(booking => booking.date)
  let sortedBookings = sortDates(bookingDates);
  sortedBookings.forEach(date => {
    $('#guest-booking-info').append(
      `
      <b>DATE</b>: ${date}
      <br/>
      <br/>
      `
    )
  })
}

$('#find-available-rooms-button').click(() => {
  let numDate = numifyDate($('#start-date').val(), '-');
  let date = stringifyDate(numDate);
  if (checkDate(date)) {
    showAvailableRooms(hotel.viewRoomsAvailable(date));
  } else {
    $('#available-rooms').text('');
    $('#available-rooms').append(`
      <br/>
      That date is in the past.
      <br/>
      We do not have time travelling capabilities (yet).
      <br/>
      Please choose another date.
      `
    )
  }
});

function showAvailableRooms(method) {
  $('#available-rooms').text('');
  if (method.length) {
    method.forEach(room => {
      $('#available-rooms').append(
        `
        <div class='individual-rooms'>
        <b id='x${room.number}x'></b>
        <b>ROOM TYPE</b>: ${room.roomType}
        </br>
        <b>NUMBER OF BEDS</b>: ${room.numBeds}
        </br>
        <b>BED SIZE</b>: ${room.bedSize}
        </br>
        <b>PRICE</b>: $${room.costPerNight}
        <br/>
        <br/>
        </div>
        `
      )
    })
    $('.individual-rooms').addClass('hoverable');
  } else {
    $('#available-rooms').append(
      `
      <b>We are so sorry, but there are no rooms available for that date. Please try another date.</b>
      `
    )
  }
};

$('#available-rooms').click(() => {
  if ($('.individual-rooms').hasClass('hoverable')) {
    $('.individual-rooms').removeClass('hoverable');
    $(event.target).closest('div').addClass('clicked');
  } else if ($(event.target).closest('div').hasClass('clicked')) {
    $('.individual-rooms').addClass('hoverable');
    $(event.target).closest('div').removeClass('clicked');
  }
});

$('.complete-booking-button').click(() => {
  if ($('.clicked').html()) {
    completeBooking();
  } else {
    //throw error
  }
});

function completeBooking() {
  let numDate = numifyDate($('#start-date').val(), '-');
  let bookingDate = stringifyDate(numDate);
  let roomNumber = parseInt($('.clicked').html().split('x')[1]);
  let postData = bookingsRepository.makeBooking(guestId, bookingDate, roomNumber);
  fetch('https://fe-apps.herokuapp.com/api/v1/overlook/1904/bookings/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  })
  .then(() => showSuccessPage());
  //.catch
}

function showSuccessPage() {
  $('.clicked').removeClass('clicked');
  $('#guest-success-page').removeClass('hide');
}

$('.book-another-button').click(() => {
  $('.individual-rooms').addClass('hoverable');
  $('#guest-success-page').addClass('hide');
});

$('.show-filter-options-button').click(() => {
  $('.individual-rooms').removeClass('hoverable');
  $('#guest-filter-page').removeClass('hide');
});

$('.filter-button').click(() => {
  let numDate = numifyDate($('#start-date').val(), '-');
  let bookingDate = stringifyDate(numDate);
  $('#guest-filter-page').addClass('hide');
  let filteredRooms = hotel.filterAvailableRooms(bookingDate, $('select').val());
  showAvailableRooms(filteredRooms);
});

// HTML PAGE NAVIGATION
$('#guest-button').click(() => {
  window.location = './login.html';
})

$('#manager-button').click(() => {
  window.location = './login.html';
})

$('#login-button').click(() => {
  if ($('#username-input').val().includes('customer') && $('#password-input').val() === 'overlook2019') {
    guestId = $('#username-input').val().split('r')[1];
    localStorage.setItem('guestId', guestId);
    window.location = './guest-view.html';
  } else if ($('#username-input').val() === 'manager' && $('#password-input').val() === 'overlook2019') {
    window.location = './manager-view.html';
  } else {
    $('#login-error').removeClass('hide');
  }
})

$('#username-input').keyup(() => {
  $('#login-error').addClass('hide');
})

$('#password-input').keyup(() => {
  $('#login-error').addClass('hide');
})

$('#cancel-login-button').click(() => {
  window.location = './index.html';
})

$('.logout-button').click(() => {
  window.location = './index.html';
})

// DATES
function getTodayDate() {
  let date = new Date();
  let month = date.getUTCMonth() + 1;
  let day = date.getUTCDate();
  let year = date.getUTCFullYear();
  if (day < 10 && month < 10) {
    return `${year}/0${month}/0${day}`;
  } else if (day < 10 && month >= 10){
    return `${year}/${month}/0${day}`;
  } else if (day >= 10 && month < 10){
    return `${year}/0${month}/${day}`;
  } else {
    return `${year}/${month}/${day}`;
  }
}

function numifyDate(date, character) {
  let year = parseInt(date.split(character)[0]);
  let month = parseInt(date.split(character)[1]);
  let day = parseInt(date.split(character)[2]);
  if (day < 10 && month < 10) {
    return parseInt(`${year}0${month}0${day}`);
  } else if (day < 10 && month >= 10){
    return parseInt(`${year}${month}0${day}`);
  } else if (day >= 10 && month < 10){
    return parseInt(`${year}0${month}${day}`);
  } else {
    return parseInt(`${year}${month}${day}`);
  }
}

function stringifyDate(date) {
  let splitDate = date.toString().split('');
  let year = `${splitDate[0]}${splitDate[1]}${splitDate[2]}${splitDate[3]}`;
  let month = `${splitDate[4]}${splitDate[5]}`;
  let day = `${splitDate[6]}${splitDate[7]}`;
  return `${year}/${month}/${day}`
}

function sortDates(dates) {
  let numDates = [];
  dates.forEach(date => {
    numDates.push(numifyDate(date, '/'));
  })
  return numDates.sort((a, b) => b - a).map(date => stringifyDate(date))
}

function checkDate(inputDate) {
  let guestDate = numifyDate(inputDate, '/');
  let todayDate = numifyDate(getTodayDate(), '/');
  if (guestDate > todayDate) {
    return true;
  } else {
    return false;
  }
}
