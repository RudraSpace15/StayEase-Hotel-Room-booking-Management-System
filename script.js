/* StayEase - Vanilla JavaScript */

document.addEventListener('DOMContentLoaded', () => {
  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  // Mobile navigation
  const menuButton = $('.hambuger');
  const menu = $('.nav-menu');

  if (menuButton && menu) {
    const toggleMenu = () => {
      const isOpen = menu.classList.toggle('active');
      menuButton.classList.toggle('active', isOpen);
    };

    menuButton.addEventListener('click', toggleMenu);
  }

  // Smooth scrolling
  $$('.js-scroll').forEach(button => {
    button.addEventListener('click', () => {
      const target = document.getElementById(
        button.dataset.target
      );

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Hero image thumbnails
  const heroImage = $('.home .image img');
  const thumbnails = $$('.home .image_item img');

  window.img = function (path) {
    if (heroImage && path) {
      heroImage.src = path;
    }
  };

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      window.img(thumb.getAttribute('src'));
    });
  });

  // Restaurant accordion
  const accordionItems = $$('.accordionItem');

  accordionItems.forEach(item => {
    const heading = $('.accordionIHeading', item);

    if (!heading) return;

    heading.addEventListener('click', () => {
      const open = !item.classList.contains('open');

      accordionItems.forEach(other => {
        other.classList.remove('open');
        other.classList.add('close');
      });

      if (open) {
        item.classList.add('open');
        item.classList.remove('close');
      }
    });
  });

  // Booking form
  const checkIn = $('#checkIn');
  const checkOut = $('#checkOut');
  const adults = $('#adults');
  const children = $('#children');
  const message = $('#bookingMessage');
  const searchButton = $('#searchRooms');
  const roomsSection = $('#rooms');

  const modal = $('#checkoutModal');
  const summary = $('#checkoutSummary');
  const paymentForm = $('#paymentForm');

  let selectedRoom = null;
  let stayNights = 0;
  let guestCount = 1;

  const showMessage = text => {
    if (message) message.textContent = text;
  };

  const localISODate = date => {
    const offset = date.getTimezoneOffset();

    return new Date(
      date.getTime() - offset * 60000
    ).toISOString().slice(0, 10);
  };

  const today = localISODate(new Date());

  if (checkIn) checkIn.min = today;
  if (checkOut) checkOut.min = today;

  if (checkIn && checkOut) {
    checkIn.addEventListener('change', () => {
      checkOut.min = checkIn.value || today;

      if (checkOut.value && checkOut.value <= checkIn.value) {
        checkOut.value = '';
      }
    });
  }

  function validateSearch() {
    if (!checkIn || !checkOut || !adults || !children) {
      showMessage('Please check your booking form.');
      return false;
    }

    if (!checkIn.value || !checkOut.value) {
      showMessage('Please select check-in and check-out dates.');
      return false;
    }

    const start = new Date(checkIn.value + 'T00:00:00');
    const end = new Date(checkOut.value + 'T00:00:00');

    const nights = Math.round(
      (end - start) / 86400000
    );

    const adultCount = Number(adults.value);
    const childCount = Number(children.value);

    if (checkIn.value < today || nights < 1) {
      showMessage('Please select valid booking dates.');
      return false;
    }

    if (
      !Number.isInteger(adultCount) ||
      adultCount < 1 ||
      !Number.isInteger(childCount) ||
      childCount < 0
    ) {
      showMessage('Please enter valid guest numbers.');
      return false;
    }

    stayNights = nights;
    guestCount = adultCount + childCount;

    showMessage(
      `Search ready: ${nights} night(s), ${guestCount} guest(s).`
    );

    return true;
  }

  if (searchButton) {
    searchButton.addEventListener('click', () => {
      if (validateSearch()) {
        roomsSection?.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  }

  // Room selection
  $$('.select-room').forEach(button => {
    button.addEventListener('click', () => {
      if (!validateSearch()) return;

      const roomName = button.dataset.room;
      const price = Number(button.dataset.price);

      if (!roomName || !Number.isFinite(price) || price <= 0) {
        showMessage('Please check room details.');
        return;
      }

      const subtotal = price * stayNights;
      const tax = Math.round(subtotal * 0.12);
      const total = subtotal + tax;

      selectedRoom = {
        name: roomName,
        price,
        subtotal,
        tax,
        total,
        guests: guestCount,
        checkIn: checkIn.value,
        checkOut: checkOut.value
      };

      if (summary) {
        summary.textContent =
          `${roomName} | ${stayNights} nights | ` +
          `Room: ${formatINR(subtotal)} | ` +
          `Tax: ${formatINR(tax)} | ` +
          `Total: ${formatINR(total)}`;
      }

      if (modal) {
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
      } else {
        showMessage('Checkout modal not found in HTML.');
      }
    });
  });

  function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Close checkout modal
  function closeModal() {
    modal?.classList.remove('show');
    modal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  $('#closeCheckout')?.addEventListener('click', closeModal);

  modal?.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });

  // Demo payment and booking
  if (paymentForm) {
    paymentForm.addEventListener('submit', event => {
      event.preventDefault();

      if (!selectedRoom) {
        alert('Please select a room first.');
        return;
      }

      if (!paymentForm.reportValidity()) return;

      const name = $('#guestName')?.value.trim();
      const email = $('#guestEmail')?.value.trim();
      const method = $('#paymentMethod')?.value;

      if (!name || !email || !method) {
        alert('Please complete all fields.');
        return;
      }

      const booking = {
        bookingId: 'SE' + Date.now().toString().slice(-8),
        guestName: name,
        email,
        paymentMethod: method,
        room: selectedRoom.name,
        checkIn: selectedRoom.checkIn,
        checkOut: selectedRoom.checkOut,
        nights: stayNights,
        guests: guestCount,
        total: selectedRoom.total,
        status: 'Confirmed',
        createdAt: new Date().toISOString()
      };

      try {
        const bookings = JSON.parse(
          localStorage.getItem('stayeaseBookings') || '[]'
        );

        bookings.push(booking);

        localStorage.setItem(
          'stayeaseBookings',
          JSON.stringify(bookings)
        );
      } catch (error) {
        console.error(error);
        alert('Could not save booking.');
        return;
      }

      alert(
        `Booking confirmed!\n` +
        `Booking ID: ${booking.bookingId}\n` +
        `Room: ${booking.room}\n` +
        `Total: ${formatINR(booking.total)}\n` +
        `Payment: ${method}\n\n` +
        `Demo only. No money has been charged.`
      );

      paymentForm.reset();
      closeModal();
      selectedRoom = null;

      showMessage(
        `Booking ${booking.bookingId} saved successfully.`
      );
    });
  }

  console.info('StayEase JavaScript loaded successfully.');
});