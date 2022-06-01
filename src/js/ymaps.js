let clusterer;

function getFeedbacksList() {
	if (localStorage.getItem('feedbacks')) {
		return JSON.parse(localStorage.getItem('feedbacks'));
	}
}

function getOptionsCluster(coords) {
	const clusterObjects = [];
	const feedbacksList = getFeedbacksList();
	for (const feedback of feedbacksList) {
		if (JSON.stringify(feedback.coords) == JSON.stringify(coords)) {
			const geoObject = new ymaps.GeoObject({
				geometry: { type: 'Point', coordinates: feedback.coords },
			});
			clusterObjects.push(geoObject);
		}
	}
	return clusterObjects;
}

function addCluster(map, coords) {
	const myGeoObjects = getOptionsCluster(coords);
	clusterer.add(myGeoObjects);
	map.balloon.close();
}

function addClusterOnMap(map) {
	const feedbacksList = getFeedbacksList();
	let usedCoords = [];
	for (const feedback of feedbacksList) {
		const coords = JSON.stringify(feedback.coords);
		if (usedCoords.indexOf(coords) == -1) {
			addCluster(map, feedback.coords);
			usedCoords.push(coords);
		}
	}
}

function mapInit() {
	document.addEventListener('DOMContentLoaded', () => {
		ymaps.ready(() => {
			const myMap = new ymaps.Map('map', {
				center: [56.32656939915104, 44.00447397770388],
				zoom: 13,
			});

			clusterer = new ymaps.Clusterer({ clusterDisableClickZoom: true });
			clusterer.options.set('hasBalloon', false);
			myMap.geoObjects.add(clusterer);

			clusterer.events.add('click', (event) => {
				event.preventDefault();

				if (event.get('target').getGeoObjects) {
					const GeoObjects = event.get('target').getGeoObjects();
					const coords = GeoObjects[0]['geometry']['_coordinates'];
					openBalloon(myMap, coords, GeoObjects);
				} else {
					const coords = event.get('target')['geometry']['_coordinates'];
					openBalloon(myMap, coords, [event.get('target')]);
				}
			});

			if (localStorage.getItem('feedbacks')) {
				addClusterOnMap(myMap);
			} else {
				localStorage.setItem('feedbacks', JSON.stringify([]));
			}

			myMap.events.add('click', (event) => {
				const coords = event.get('coords');
				openBalloon(myMap, coords, []);
			});
		});
	});
}

function getFeedbacksHTML(currentGeoObjects) {
	let reviewListHTML = '';

	for (const feedback of getFeedbacksList()) {
		if (currentGeoObjects.some((geoObject) => JSON.stringify(geoObject.geometry._coordinates) === JSON.stringify(feedback.coords))) {
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

async function openBalloon(map, coords, currentGeoObjects) {
	await map.balloon.open(coords, {
		content: `<div class="feedbacks__list">${getFeedbacksHTML(currentGeoObjects)}</div>` + formTemplate,
	});

	const balloon = document.querySelector('#form');
	balloon.addEventListener('submit', function (event) {
		event.preventDefault();

		const feedback = {
			coords: coords,
			name: this.elements.name.value,
			place: this.elements.place.value,
			comment: this.elements.comment.value,
		};

		updateLocalStorage(feedback);
		map.balloon.close();
		clusterer.removeAll();
		addClusterOnMap(map);
	});
}

function updateLocalStorage(update) {
	const newLocalStorage = JSON.parse(localStorage.getItem('feedbacks'));
	newLocalStorage.push(update);
	localStorage.setItem('feedbacks', JSON.stringify(newLocalStorage));
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
