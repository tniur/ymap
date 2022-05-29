let feedbacks;

if (localStorage.getItem('feedbacks')) {
	feedbacks = JSON.parse(localStorage.getItem('feedbacks'));
} else {
	feedbacks = [];
}

function mapInit() {
	document.addEventListener('DOMContentLoaded', () => {
		ymaps.ready(() => {
			const myMap = new ymaps.Map('map', {
				center: [56.32656939915104, 44.00447397770388],
				zoom: 13,
				behaviors: ['drag'],
			});

			let commonCluster = new ymaps.Clusterer({ clusterDisableClickZoom: true });
			myMap.geoObjects.add(commonCluster);

			if (localStorage.getItem('feedbacks')) {
				for (const feedback of feedbacks) {
					addCluster(myMap, feedback.coords, commonCluster);
				}
			}

			if (feedbacks)
				myMap.events.add('click', (event) => {
					const coords = event.get('coords');
					openBalloon(myMap, coords, undefined, undefined, commonCluster);
				});
		});
	});
}

function getOptionsCluster(coords) {
	const clusterObjects = [];
	for (const feedback of feedbacks) {
		if (JSON.stringify(feedback.coords) == JSON.stringify(coords)) {
			const geoObject = new ymaps.GeoObject({
				geometry: { type: 'Point', coordinates: feedback.coords },
			});
			clusterObjects.push(geoObject);
		}
	}
	return clusterObjects;
}

function addCluster(map, coords, commonCluster) {
	const clusterer = new ymaps.Clusterer({ clusterDisableClickZoom: true });
	clusterer.options.set('hasBalloon', false);

	function addToCluster() {
		const myGeoObjects = getOptionsCluster(coords);
		map.geoObjects.add(clusterer);
		clusterer.add(myGeoObjects);
		// commonCluster
		// Кластеризация работает, но перестуют обрабатываться
		// события по клику
		// commonCluster.add(myGeoObjects);
		map.balloon.close();
	}

	clusterer.events.add('click', (event) => {
		event.preventDefault();
		openBalloon(map, coords, clusterer, addToCluster, commonCluster);
	});

	addToCluster();
}

function getFeedbacksList(coords) {
	let reviewListHTML = '';

	for (const feedback of feedbacks) {
		if (JSON.stringify(feedback.coords) == JSON.stringify(coords)) {
			reviewListHTML += `
				<div class="feedback__item">
					<div class="feedback__row">
						<div class="feedback__name">${feedback.name}</div>
						<div class="feedback__place">${feedback.place}</div>
					</div>
					<div class="feedback__row">
						<div class="feedback__comment">${feedback.comment}</div>
					</div>
				</div>`;
		}
	}
	return reviewListHTML;
}

async function openBalloon(map, coords, clusterer, fn, commonCluster) {
	await map.balloon.open(coords, {
		content: `<div class="feedbacks__list">${getFeedbacksList(coords)}</div>` + formTemplate,
	});

	const balloon = document.querySelector('#form');
	balloon.addEventListener('submit', function (event) {
		event.preventDefault();
		if (clusterer) {
			clusterer.removeAll();
		}

		const feedback = {
			coords: coords,
			name: this.elements.name.value,
			place: this.elements.place.value,
			comment: this.elements.comment.value,
		};

		feedbacks.push(feedback);
		updateLocalStorage(feedback);

		if (!fn) {
			addCluster(map, coords, commonCluster);
		} else {
			fn();
		}

		map.balloon.close();
	});
}

function updateLocalStorage(update) {
	if (localStorage.getItem('feedbacks')) {
		const newLocalStorage = JSON.parse(localStorage.getItem('feedbacks'));
		newLocalStorage.push(update);
		localStorage.setItem('feedbacks', JSON.stringify(newLocalStorage));
	} else {
		localStorage.setItem('feedbacks', JSON.stringify([update]));
	}
}

const formTemplate = [
	'<div class="balloon">',
	'<div class="balloon__title">Отзыв:</div>',
	'<form id="form" class="balloon__form">',
	'<input id="name-input" name="name" class="balloon__input" type="text" placeholder="Укажите ваше имя">',
	'<input id="place-input" name="place" class="balloon__input" type="text" placeholder="Укажите место">',
	'<textarea id="comment-input" name="comment" class="balloon__input balloon__input--textarea" placeholder="Оставьте отзыв"></textarea>',
	'<div><button id="add-button" class="balloon__button">Добавить</button></div>',
	'</form>',
	'</div>',
].join('');

export { mapInit };
