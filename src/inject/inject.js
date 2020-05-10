const log = (args) => {
	console.log(`[Github-HotSpotter]`, args)
};

const colourMap = {
	ROCKET: '9C8ADE',
	EYES: '#BC85A3',
	THUMBS_UP: '#70AE98',
	THUMBS_DOWN: '#F0A35E',
	LAUGH: '#ECBE7A',
	HOORAY: '#9DABDD',
	HEART: '#FEADB9'
};

const getViewportHeight = () => document.documentElement.clientHeight;

const getDocumentHeight = () => {
	const body = document.body;
	const html = document.documentElement;

	return Math.max(
		body.scrollHeight,
		body.offsetHeight,
		html.clientHeight,
		html.scrollHeight,
		html.offsetHeight
	);
};

const WRAPPER_ID = 'gh-spotter';
const UNKNOWN_TYPE = 'unknown';
const viewportHeight = getViewportHeight();
const documentHeight = getDocumentHeight();

const injectStyles = () => {
	const style = document.createElement('style');

	style.innerHTML = `
		#${WRAPPER_ID} {
			position: fixed;
			top: 0;
			right: 0;
			width: 100px;
			height: 100%;
			z-index: 109;
		}

		#${WRAPPER_ID} .hotspot-group {
			height: 5px;
			position: fixed;
		}

		#${WRAPPER_ID} .hotspot-group .hotspot {
			height: 5px;
			background-color: #dadada;
		}
	`;

	document.getElementsByTagName('head')[0].appendChild(style);
};

const injectOverlay = () => {
	const overlay = document.createElement('div');

	document.body.appendChild(overlay);
	overlay.id = WRAPPER_ID;

	return overlay;
};

function groupBy(collection, property) {
	var i = 0, val, index,
		values = [], result = [];
	for (; i < collection.length; i++) {
		val = collection[i][property];
		index = values.indexOf(val);
		if (index > -1)
			result[index].push(collection[i]);
		else {
			values.push(val);
			result.push([collection[i]]);
		}
	}
	return result;
}

const getNumberAsPercentageOfAnother = (numerator, denominator) => (numerator / denominator) * 100;

const getDistanceFromTopOfDoc = (ele) => {
	const rect = ele.getBoundingClientRect(),
		scrollTop = window.pageYOffset || document.documentElement.scrollTop;
	return rect.top + scrollTop;
};

const collectHotSpotData = () => Array
	.from(document.querySelectorAll('button.reaction-summary-item'))
	.map((node) => {
		const pixelsFromTop = getDistanceFromTopOfDoc(node);

		return {
			node,
			total: parseInt(node.childNodes[2]?.textContent?.trim()) || 0,
			type: node.value?.split(' ')?.[0] || UNKNOWN_TYPE,
			pixelsFromTop,
			percentFromTop: getNumberAsPercentageOfAnother(pixelsFromTop, documentHeight),
			emoji: node.children?.[0].textContent
		};
	});

const createHotspotGroupEle = ({ percentFromTop }) => {
	const hotSpotEle = document.createElement('div');

	hotSpotEle.className = 'hotspot-group';
	hotSpotEle.style.top = `${percentFromTop}%`;

	return hotSpotEle;
};

const createHotspotEle = ({ emoji, total, type }) => {
	const hotSpotEle = document.createElement('div');

	hotSpotEle.className = 'hotspot';
	hotSpotEle.title = `${emoji} - ${total}`;
	hotSpotEle.style.width = `${total}px`;
	hotSpotEle.style.backgroundColor = colourMap[type];
	// console.log(colourMap[type])
	return hotSpotEle;
};

const drawOverlayContents = ({ overlayDiv, data }) => {

	console.log({
		overlayDiv,
		data,
		viewportHeight,
		documentHeight
	})

	const hotspotGroups = groupBy(data, 'percentFromTop');

	Object.values(hotspotGroups).forEach((hotspots) => {
		// console.log({ hotspots })

		const hotspotGroup = createHotspotGroupEle({
			percentFromTop: hotspots?.[0].percentFromTop
		});
		overlayDiv.appendChild(hotspotGroup);

		hotspots.forEach(({ emoji, total, type }) => {
			const hotspot = createHotspotEle({ emoji, total, type });
			hotspotGroup.appendChild(hotspot);
		})
	});
};

chrome.extension.sendMessage({}, () => {
	const readyStateCheckInterval = setInterval(() => {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			setTimeout(() => {
				bootSpotter();
			}, 3000);
		}
	}, 10);
});


const bootSpotter = () => {
	log('Booting...')

	injectStyles();

	const overlayDiv = injectOverlay();
	const data = collectHotSpotData();

	drawOverlayContents({
		overlayDiv,
		data
	});

	// go and collect info on all of the emoji nodes in the page
	// populate overlay with that stuff then
};