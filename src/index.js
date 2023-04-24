import './css/styles.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const searchForm = document.querySelector('#search-form');
const btnLoadMore = document.querySelector('.load-more');
const gallerySection = document.querySelector('.gallery');

let windowHeite = document.documentElement.clientHeight;
let windowWidth = document.documentElement.clientWidth;

window.addEventListener('resize', myFunction);

function myFunction() {
  windowHeite = document.documentElement.clientHeight;
  windowWidth = document.documentElement.clientWidth;
  //   console.log('windowWidth ', windowWidth, 'windowHeite ', windowHeite);
}

let gallery = new SimpleLightbox('.gallery a', { enableKeyboard: true }); // создание галереи по классу
let q = ''; // параметр для Qwery запроса
let searchResult = ''; // значение инпута по умолчанию
let pageN = 1; // страница по умолчанию
let searchNumber = 0;

// //	Ваш ключ API:35688783-f7dd279a2997f488b5e5fbef0
const pixabayAPI = {
  baseUrl: 'https://pixabay.com/api/',
  key: '35688783-f7dd279a2997f488b5e5fbef0',
  image_type: 'photo',
  orientation: 'horizontal',
  safesearch: true,
  page: '1',
  per_page: '40',
};

let htmlCode = '';

searchForm.addEventListener('submit', onSearchForm); // --------------------слушатель отправки формы-------------------

async function onSearchForm(evt) {
  evt.preventDefault();
  searchResult = evt.target[0].value; // значение инпута при отправе формы
  if (searchResult === '') {
    gallerySection.innerHTML = ''; // если пусто - очищаем галерею
    btnLoadMore.classList.remove('is-visible'); //кнопку LoadMore делаем невидимой
    return Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
  }
  if (searchResult !== q) {
    // если поле поиска изменилось
    pageN = 1;
    gallerySection.innerHTML = ''; // очищаем галерею
    pixabayAPI.page = `${pageN}`; //текущую страницу запроса делаем "1"
    btnLoadMore.classList.remove('is-visible'); //кнопку LoadMore делаем невидимой
  } else {
    pageN += 1;
    pixabayAPI.page = `${pageN}`;
    btnLoadMore.classList.remove('is-visible');
  }

  q = searchResult;

  try {
    const results = await fetchPhotos(searchResult);
    // заполнение страницы карточками
    htmlCode = await markup(results);
    gallerySection.insertAdjacentHTML('beforeend', htmlCode);
    btnLoadMore.classList.add('is-visible');

    // simpleLightbox  - очистка и реинсталяция gallery
    gallery.refresh();

    const { page, per_page } = pixabayAPI;
    const { total, totalHits, hits } = results;
    const totalPages = Math.ceil(totalHits / per_page);

    if (page >= totalPages) {
      btnLoadMore.classList.remove('is-visible');
    }
    if (searchNumber !== 0) {
      Notify.success(`'Hooray! We found ${results.totalHits} images.'`);
    }

    // console.log('results', results);
  } catch (error) {
    Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
  }
  searchNumber += 1;
}

// button load more         --------------------слушатель 'click' button load more -------------------

btnLoadMore.addEventListener('click', async () => {
  pageN += 1;
  pixabayAPI.page = `${pageN}`;

  try {
    const results = await fetchPhotos(searchResult);
    // заполнение страницы карточкам
    htmlCode = await markup(results);
    gallerySection.insertAdjacentHTML('beforeend', htmlCode);
    btnLoadMore.classList.add('is-visible');

    // simpleLightbox  - очистка и реинсталяция gallery
    gallery.refresh();

    const {
      baseUrl,
      key,
      image_type,
      orientation,
      safesearch,
      order,
      page,
      per_page,
    } = pixabayAPI;
    const { total, totalHits, hits } = results;
    const totalPages = Math.ceil(totalHits / per_page);
    if (page >= totalPages) {
      btnLoadMore.classList.remove('is-visible');
    }
  } catch (error) {
    Notify.failure(
      "We're sorry, but you've reached the end of search results."
    );
  }

  // ------------------- прокрутка страницы----------------------
  //   const cardHeight =
  //     document.querySelector('.gallery').firstElementChild.scrollHeight;
  //   console.log(cardHeight * 2.92);
  window.scrollBy({
    top: windowHeite * 0.85,
    behavior: 'smooth',
  });
});

//  разбиение галереи на страницы
async function fetchPhotos(searchResult) {
  //    деструктуризация  объекта полей запроса на сервер
  const {
    baseUrl,
    key,
    image_type,
    orientation,
    safesearch,
    order,
    page,
    per_page,
  } = pixabayAPI;

  pixabayAPI.page = `${pageN}`;

  const response = await axios.get(
    `${baseUrl}?key=${key}&q=${q}&image_type=${image_type}&orientation=${orientation}&safesearch=${safesearch}&order=${order}&page=${page}&per_page=${per_page}`
  );

  const results = response.data; //   ответ с сервера ---->  response.data
  //    деструктуризация results
  const { total, totalHits } = results;
  const totalPages = Math.floor(totalHits / per_page);
  //  проверка  на  общее количество элементов в response - если "0" - Error
  if (total === 0) {
    throw new Error();
  }
  //    -----------подсчёт количества страниц----------
  //если номер страницы больше чем всего страниц - убираем видимлсть кнопки LoadMore
  if (page > totalPages) {
    btnLoadMore.classList.remove('is-visible');
    Notify.info("We're sorry, but you've reached the end of search results.");
  }
  return results;
}

// <!-- Карточка изображения -->     markup
function markup(results) {
  const { hits } = results; // деструктуризация results
  return hits
    .map(
      hit =>
        `<a href="${hit.largeImageURL}">
            <div class="photo-card">
                <img src="${hit.webformatURL}" alt="${hit.tags}" loading="lazy" class="img-item" />
                <div class="info">
                    <p class="info-item">
                        <b>Likes:</b>${hit.likes}
                    </p>
                    <p class="info-item">
                        <b>Views:</b>${hit.views}
                    </p>
                    <p class="info-item">
                        <b>Comments:</b>${hit.comments}
                    </p>
                    <p class="info-item">
                        <b>Downloads:</b>${hit.downloads}
                    </p>
                </div>
            </div>
        </a>`
    )
    .join('');
}
