// src/components/watchedModal.ts
import { markAsWatched } from '../services/movieApi';
import type { DatabaseMovie } from '../types/movie';

export function createWatchedModal(
  movie: DatabaseMovie,
  onSuccess: () => void
): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Mark as Watched</h2>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      
      <div class="modal-body">
        <h3>${movie.title}</h3>
        <p class="modal-subtitle">${movie.release_date?.substring(0, 4) || 'N/A'}</p>
        
        <div class="form-group">
          <p>Your Rating *</p>
          <div class="star-rating" id="rating">
            ${[1, 2, 3, 4, 5].map(n => `
              <span class="star" data-rating="${n}">★</span>
            `).join('')}
          </div>
          <p class="rating-text">Click to rate</p>
        </div>
        
        <div class="form-group">
          <label for="review">Your Review (optional)</label>
          <textarea 
            id="review" 
            rows="4" 
            placeholder="What did you think about this movie?"
          ></textarea>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary modal-cancel">Cancel</button>
        <button class="btn-primary modal-submit" disabled>Mark as Watched</button>
      </div>
    </div>
  `;
  
  // State
  let selectedRating = 0;
  
  // Elements
  const closeBtn = modal.querySelector('.modal-close') as HTMLButtonElement;
  const cancelBtn = modal.querySelector('.modal-cancel') as HTMLButtonElement;
  const submitBtn = modal.querySelector('.modal-submit') as HTMLButtonElement;
  const reviewInput = modal.querySelector('#review') as HTMLTextAreaElement;
  const stars = modal.querySelectorAll('.star');
  const ratingText = modal.querySelector('.rating-text') as HTMLParagraphElement;
  
  // Star rating logic
  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt((star as HTMLElement).dataset.rating || '0');
      updateStars(selectedRating);
      submitBtn.disabled = false;
      ratingText.textContent = `Rating: ${selectedRating} / 5`;
    });
    
    star.addEventListener('mouseenter', () => {
      const hoverRating = parseInt((star as HTMLElement).dataset.rating || '0');
      updateStars(hoverRating);
    });
  });
  
  modal.querySelector('.star-rating')?.addEventListener('mouseleave', () => {
    updateStars(selectedRating);
  });
  
  function updateStars(rating: number) {
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  }
  
  // Close handlers
  function closeModal() {
    modal.classList.add('fade-out');
    setTimeout(() => modal.remove(), 300);
  }
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Submit handler
  submitBtn.addEventListener('click', async () => {
    if (selectedRating === 0) {
      alert('Please select a rating');
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    try {
      await markAsWatched(movie.id, selectedRating, reviewInput.value.trim() || undefined);
      
      // Success!
      closeModal();
      onSuccess();
      showNotification(`${movie.title} marked as watched!`);
      
    } catch (error) {
      console.error('Failed to mark as watched:', error);
      alert('Failed to mark as watched. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Mark as Watched';
    }
  });
  
  return modal;
}

function showNotification(message: string) {
  const notification = document.createElement('div');
  notification.className = 'notification success';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}