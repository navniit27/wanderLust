(() => {
  'use strict'

  const forms = document.querySelectorAll('.needs-validation')

  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      const password = form.id === 'signup-form'
        ? form.querySelector('input[name="password"]')
        : null

      // Signup password must be at least 8 characters
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

// Review form validation

document.querySelectorAll('.review-form-card form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    const rating = form.querySelector(
      'input[name="review[rating]"]:checked'
    )

    const ratingError = form.querySelector('.rating-invalid-feedback')

    if (!rating) {
      event.preventDefault()
      event.stopPropagation()

      if (ratingError) {
        ratingError.classList.add('show')
      }
    } else if (ratingError) {
      ratingError.classList.remove('show')
    }
  })
})

const taxToggle = document.getElementById('tax-toggle')

if (taxToggle) {
  taxToggle.addEventListener('change', ({ target }) => {
    document.querySelectorAll('.tax-info').forEach((taxInfo) => {
      const priceLine = taxInfo.closest('.price-line')
      const priceElement = priceLine?.querySelector('.listing-price')
      const basePrice = Number(priceElement?.dataset.price || 0)

      taxInfo.style.display = target.checked ? 'inline' : 'none'

      if (priceElement && basePrice) {
        priceElement.textContent = `₹ ${Math.round(
          basePrice * (target.checked ? 1.18 : 1)
        ).toLocaleString('en-IN')}`
      }
    })
  })
}

// Copy the current listing URL
document.querySelectorAll('[data-share-button]').forEach((button) => {
  button.addEventListener('click', async () => {
    const shareUrl = window.location.href

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textArea = document.createElement('textarea')

        textArea.value = shareUrl
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'

        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const copied = document.execCommand('copy')
        textArea.remove()

        if (!copied) {
          throw new Error('Copy failed')
        }
      }

      button.innerHTML =
        '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied'

      setTimeout(() => {
        button.innerHTML =
          '<i class="fa-solid fa-share" aria-hidden="true"></i> Share'
      }, 1400)

    } catch (error) {
      button.innerHTML =
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i> Copy failed'

      setTimeout(() => {
        button.innerHTML =
          '<i class="fa-solid fa-share" aria-hidden="true"></i> Share'
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