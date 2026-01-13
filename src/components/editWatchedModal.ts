// src/components/editWatchedModal.ts
import { updateWatched } from '../services/movieApi';
import type { DatabaseMovie } from '../types/movie';

export function createEditWatchedModal(
  movie: DatabaseMovie,
  onSuccess: () => void
): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Edit Rating & Review</h2>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      
      <div class="modal-body">
        <h3>${movie.title}</h3>
        <p class="modal-subtitle">${movie.release_date?.substring(0, 4) || 'N/A'}</p>
        
        <div class="form-group">
          <label for="rating">Your Rating *</label>
          <div class="star-rating" id="rating">
            ${[1, 2, 3, 4, 5].map(n => `
              <span class="star ${n <= (movie.personal_rating || 0) ? 'active' : ''}" data-rating="${n}">★</span>
            `).join('')}
          </div>
          <p class="rating-text">Rating: ${movie.personal_rating || 0} / 5</p>
        </div>
        
        <div class="form-group">
          <label for="review">Your Review (optional)</label>
          <textarea 
            id="review" 
            rows="4" 
            placeholder="What did you think about this movie?"
          >${movie.review || ''}</textarea>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary modal-cancel">Cancel</button>
        <button class="btn-primary modal-submit">Save Changes</button>
      </div>
    </div>
  `;
  
  // State - använd befintligt rating som default
  let selectedRating = movie.personal_rating || 0;
  
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
      await updateWatched(movie.id, selectedRating, reviewInput.value.trim() || undefined);
      
      closeModal();
      onSuccess();
      showNotification(`${movie.title} updated!`);
      
    } catch (error) {
      console.error('Failed to update movie:', error);
      alert('Failed to update movie. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Changes';
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