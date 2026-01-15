// src/components/watchedModal.ts
import { markAsWatched, addAsWatched } from '../services/movieApi';
import type { DatabaseMovie, TMDBMovie } from '../types/movie';

// Type guard to check if movie is DatabaseMovie
function isDatabaseMovie(movie: DatabaseMovie | TMDBMovie): movie is DatabaseMovie {
  return 'id' in movie && 'tmdb_id' in movie;
}

export function createWatchedModal(
  movie: DatabaseMovie | TMDBMovie,
  onSuccess: (updatedMovie: DatabaseMovie) => void  // ⭐ Pass updated movie back
): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  
  const title = movie.title;
  const year = movie.release_date?.substring(0, 4) || 'N/A';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Mark as Watched</h2>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      
      <div class="modal-body">
        <h3>${title}</h3>
        <p class="modal-subtitle">${year}</p>
        
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
  
  let selectedRating = 0;
  
  const closeBtn = modal.querySelector('.modal-close') as HTMLButtonElement;
  const cancelBtn = modal.querySelector('.modal-cancel') as HTMLButtonElement;
  const submitBtn = modal.querySelector('.modal-submit') as HTMLButtonElement;
  const reviewInput = modal.querySelector('#review') as HTMLTextAreaElement;
  const stars = modal.querySelectorAll('.star');
  const ratingText = modal.querySelector('.rating-text') as HTMLParagraphElement;
  
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
  
  function closeModal() {
    modal.classList.add('fade-out');
    setTimeout(() => modal.remove(), 300);
  }
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  submitBtn.addEventListener('click', async () => {
    if (selectedRating === 0) {
      alert('Please select a rating');
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    try {
      const review = reviewInput.value.trim() || undefined;
      let updatedMovie: DatabaseMovie;
      
      if (isDatabaseMovie(movie)) {
        console.log('Updating existing movie in database:', movie.id);
        updatedMovie = await markAsWatched(movie.id, selectedRating, review);
      } else {
        console.log('Adding new movie directly as watched:', movie.id);
        updatedMovie = await addAsWatched(movie, selectedRating, review);
      }
      
      closeModal();
      onSuccess(updatedMovie);  // ⭐ Pass the updated movie back
      
    } catch (error) {
      console.error('Failed to mark as watched:', error);
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('already exists')) {
        alert('This movie is already in your collection. Please edit it from your Watched list.');
      } else {
        alert('Failed to mark as watched. Please try again.');
      }
      
      submitBtn.disabled = false;
      submitBtn.textContent = 'Mark as Watched';
    }
  });
  
  return modal;
}