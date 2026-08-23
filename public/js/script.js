(() => {
  'use strict'

  const forms = document.querySelectorAll('.needs-validation')

  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      const password = form.id === 'signup-form' ? form.querySelector('input[name="password"]') : null

      if (password && password.value.length < 8) {
        event.preventDefault()
        event.stopPropagation()
        password.setCustomValidity('Password must be at least 8 characters.')
        alert('Password must be at least 8 characters.')
      } else if (password) {
        password.setCustomValidity('')
      }

      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()

const taxToggle = document.getElementById('tax-toggle')

if (taxToggle) {
  taxToggle.addEventListener('change', ({ target }) => {
    document.querySelectorAll('.tax-info').forEach((taxInfo) => {
      const priceLine = taxInfo.closest('.price-line')
      const priceElement = priceLine?.querySelector('.listing-price')
      const basePrice = Number(priceElement?.dataset.price || 0)

      taxInfo.style.display = target.checked ? 'inline' : 'none'

      if (priceElement && basePrice) {
        priceElement.textContent = `₹ ${Math.round(basePrice * (target.checked ? 1.18 : 1)).toLocaleString('en-IN')}`
      }
    })
  })
}


document.querySelectorAll('[data-share-button]').forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied'
      setTimeout(() => {
        button.innerHTML = '<i class="fa-solid fa-share" aria-hidden="true"></i> Share'
      }, 1400)
    } catch (error) {
      button.textContent = 'Copy unavailable'
      setTimeout(() => {
        button.innerHTML = '<i class="fa-solid fa-share" aria-hidden="true"></i> Share'
      }, 1400)
    }
  })
})


document.querySelectorAll('[data-flash-alert]').forEach((flash) => {
  const closeFlash = () => {
    if (!flash.isConnected) return
    flash.classList.remove('show')
    window.setTimeout(() => flash.remove(), 180)
  }

  const closeButton = flash.querySelector('[data-flash-close]')
  if (closeButton) {
    closeButton.addEventListener('click', (event) => {
      event.preventDefault()
      closeFlash()
    })
  }

  window.setTimeout(closeFlash, 5000)
})
