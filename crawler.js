const axios = require('axios');
const fs = require('fs');

const url = process.argv[2];
const depth = process.argv[3];

const getPageAssets = async (url) => {
	const HTMLContent = await axios.get(url);
	const imgRegex = /<img[^>]+src="?([^"\s]+)"?[^>]*\/>/g;
	const linkRegex = /href="([^\'\"]+)/g;
	const arrayOfImagesStrings = HTMLContent.data.match(imgRegex);
	const arrayOfImagesSrcStrings = arrayOfImagesStrings
		? arrayOfImagesStrings.map((imgHtmlString) =>
				imgHtmlString.replace(/.*src="([^"]*)".*/, '$1')
		  )
		: [];
	const arrayOfLinksStrings = HTMLContent.data.match(linkRegex);
	const arrayOfLinksHrefStrings = arrayOfLinksStrings
		? arrayOfLinksStrings
				.map((linkHtmlString) => linkHtmlString.split('"')[1])
				.filter((link) => link.startsWith('http'))
		: [];
	return {
		linksArray: arrayOfLinksHrefStrings,
		imagesArray: arrayOfImagesSrcStrings,
	};
};

const formatImagesLinks = (imageArray, sourceUrl, depth) =>
	imageArray.map((image) => ({ imageUrl: image, sourceUrl, depth }));

let currentDepth = 0;

let result = [];

const crawlCurrentLinks = async (currentLinks) => {
	let nextLinks = [];
	for (let i = 0; i < currentLinks.length; i++) {
		const { linksArray, imagesArray } = await getPageAssets(currentLinks[i]);
		const formattedImagesArray = formatImagesLinks(
			imagesArray,
			currentLinks[i],
			currentDepth
		);
		nextLinks = [...nextLinks, ...linksArray];
		result = [...result, ...formattedImagesArray];
	}

	if (currentDepth < depth) {
		currentDepth++;
		await crawlCurrentLinks(nextLinks);
	}
};

crawlCurrentLinks([url]).then(() => {
	fs.writeFileSync('./result.json', JSON.stringify(result));
});
