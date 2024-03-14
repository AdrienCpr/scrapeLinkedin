const http = require('http');
const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio'); // Ajouter cette ligne pour utiliser Cheerio

const app = express();
const port = 3021;

const server = http.createServer(app);

app.get('/', (req, res) => {
    const routes = app._router.stack
        .filter((r) => r.route && r.route.path)
        .map((r) => `${Object.keys(r.route.methods).join(', ')} -> ${r.route.path}`)
        .join('\n');
    res.send(`<p>L'id correspond a ce qu'il y a après le in/</p><p>Exemple: https://www.linkedin.com/in/<b>adrien-compare-4692b722b</b></p><pre>${routes}</pre>`);
});

app.get('/:id', async (req, res) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const url = `https://fr.linkedin.com/in/${req.params.id}`;
        await page.goto(url);

        await page.waitForSelector('.profile');

        const html = await page.$eval('.profile', element => element.innerHTML);

        const $ = cheerio.load(html);

        const data = {
            bio: [],
            experience: [],
            education: []
        };

        const image_url = $('img.inline-block').attr('src')
        const name = $('.top-card-layout__title').text().trim();
        const title = $('.top-card-layout__headline').text().trim();
        let location = $('.not-first-middot').first().text().trim();
        const bio = $('.core-section-container__content').first().text().trim();

        location = (location.split("\n"))[0]
        data.bio.push({image_url, name, title, location, bio});

        $('.experience__list li').each((index, element) => {
            const title = $(element).find('.experience-item__title').text().trim();
            const company = $(element).find('.experience-item__subtitle').text().trim();
            const location = $(element).find('.experience-item__meta-item:nth-child(2)').text().trim();
            let date_duration = $(element).find('.experience-item__meta-item .date-range').text().trim();
            date_duration = date_duration.split("\n")
            const date = date_duration[0].trim()
            const duration = date_duration[1].trim()

            data.experience.push({title, company, location, date, duration});
        });

        $('.education__list li').each((index, element) => {
            const company = $(element).find('h3').text().trim();
            let title = $(element).find('.control-transition').text().trim();
            const duration = $(element).find('span.date-range').text().trim();
            title = title.replace(/([a-z])([A-Z])/g, '$1 $2');

            data.education.push({company, title, duration});
        });

        await browser.close();

        res.status(200).send(data);
    } catch (error) {
        res.status(500).json({error: error});
    }
});

app.get('/:id/bio', async (req, res) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const url = `https://fr.linkedin.com/in/${req.params.id}`;
        await page.goto(url);

        await page.waitForSelector('.profile');

        const html = await page.$eval('.profile', element => element.innerHTML);

        const $ = cheerio.load(html);

        const image_url = $('img.inline-block').attr('src')
        const name = $('.top-card-layout__title').text().trim();
        const title = $('.top-card-layout__headline').text().trim();
        let location = $('.not-first-middot').first().text().trim();
        const bio = $('.core-section-container__content').first().text().trim();

        location = (location.split("\n"))[0]
        const item = {image_url, name, title, location, bio};

        await browser.close();

        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({error: error.message}); // Modifier ici pour renvoyer l'erreur spécifique
    }
});


app.get('/:id/experience', async (req, res) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const url = `https://fr.linkedin.com/in/${req.params.id}`;
        await page.goto(url);

        await page.waitForSelector('.experience__list');

        const sectionContent = await page.$eval('.experience__list', element => element.innerHTML);
        const $ = cheerio.load(sectionContent);
        const data = [];

        $('li').each((index, element) => {
            const title = $(element).find('.experience-item__title').text().trim();
            const company = $(element).find('.experience-item__subtitle').text().trim();
            const location = $(element).find('.experience-item__meta-item:nth-child(2)').text().trim();
            let date_duration = $(element).find('.experience-item__meta-item .date-range').text().trim();
            date_duration = date_duration.split("\n")
            const date = date_duration[0].trim()
            const duration = date_duration[1].trim()

            const item = {title, company, location, date, duration};

            data.push(item);
        });

        await browser.close();

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({error: error});
    }
});

app.get('/:id/education', async (req, res) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const url = `https://fr.linkedin.com/in/${req.params.id}`;
        await page.goto(url);

        await page.waitForSelector('.education__list');

        const sectionContent = await page.$eval('.education__list', element => element.innerHTML);
        const $ = cheerio.load(sectionContent);
        const data = [];

        $('li').each((index, element) => {
            const company = $(element).find('h3').text().trim();
            let title = $(element).find('.control-transition').text().trim();
            const duration = $(element).find('span.date-range').text().trim();

            title = title.replace(/([a-z])([A-Z])/g, '$1 $2');
            const item = {company, title, duration};

            data.push(item);
        });

        await browser.close();

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({error: error});
    }
});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
