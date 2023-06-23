function getSections() {
    // We do not require section data scrapped for Talk pages.

    const skin = mw.config.get('skin');
    const namespace = mw.config.get('wgCanonicalNamespace');

    let sections = [];
    if (namespace === "Talk") {
        sections = findSectionInTalkPage()
    } else if (skin === "vector-2022" && namespace === "") {
        sections = findSectionsVector2022InArticlePage()
    } else if (skin === "minerva" && namespace === "") {
        sections = findSectionsMinervaInArticlePage()
    } else {
        console.error('Section Summarizer does not support this skin or namespace');
        return;
    }

    if (sections.length !== 0) {
        sections = sections.map(formatSection);
    }
    return sections;
}

function getPlainTextFromHtml(html) {
    var temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove content of <style>, <script>, and other similar elements
    var elementsToRemove = temp.querySelectorAll('style, script, noscript, iframe, object, embed, span.mw-editsection, img');
    Array.prototype.forEach.call(elementsToRemove, function (element) {
        element.parentNode.removeChild(element);
    });

    var plainText = temp.textContent || temp.innerText || '';

    return plainText.trim();
}

function formatSection(section) {
    const namespace = mw.config.get("wgCanonicalNamespace");
    if (namespace !== "Talk") {
        section.contentPlain = getPlainTextFromHtml(section.contentHtml);
        section.contentPlainLength = section.contentPlain.length;
    }
    return section;
}


/* Minerva skin */
function findSectionsMinervaInTalkPage() {
    headingElements = document.querySelectorAll('#mw-content-text > .mw-parser-output > .mw-heading');
    if (headingElements.length === 0) {
        console.error('can not find heading elements');
        return null;
    }

    const sections = [];
    headingElements.forEach(function (headingElement) {
        const section = {};

        const titleElement = headingElement.querySelector('.mw-headline');
        if (!titleElement) {
            console.error('can not find title element');
            return null;
        }
        section.title = titleElement.textContent;

        const sectionElement = headingElement.nextElementSibling;
        if (!sectionElement || sectionElement.tagName !== 'SECTION') {
            console.error('can not find section element');
            return null;
        }

        section.contentHtml = sectionElement.outerHTML;
        section.firstContentElement = sectionElement.firstElementChild;

        sections.push(section);
    });

    return sections;
}


function findSectionsMinervaInArticlePage() {
    headingElements = document.querySelectorAll('#mw-content-text > .mw-parser-output > h2.section-heading');
    if (headingElements.length === 0) {
        console.error('can not find heading elements');
        return null;
    }

    const sections = [];
    headingElements.forEach(function (headingElement) {
        const section = {};

        const titleElement = headingElement.querySelector('.mw-headline');
        if (!titleElement) {
            console.error('can not find title element');
            return null;
        }
        section.title = titleElement.textContent;

        const sectionElement = headingElement.nextElementSibling;
        if (!sectionElement || sectionElement.tagName !== 'SECTION') {
            console.error('can not find section element');
            return null;
        }

        section.contentHtml = sectionElement.outerHTML;
        section.firstContentElement = sectionElement.firstElementChild;

        sections.push(section);
    });

    return sections;
}

/* Vector 2022 */
function findSectionInTalkPage() {
    const sections = [];
    $('#mw-content-text > .mw-parser-output > .mw-heading').each(function() {
        const titleElement = $(this).find('h2 > .mw-headline');
        if (!titleElement.length) {
            console.error('Cannot find title element');
            return null;
        }
        sections.push({
            contentPlainLength: $(this).nextUntil('.mw-heading').text().length,
            title: titleElement.text(),
            firstContentElement: this.nextElementSibling
        });
    });

    return sections;
}

function findSectionsVector2022InArticlePage() {
    headingElements = document.querySelectorAll('#mw-content-text > .mw-parser-output > h2');
    if (headingElements.length === 0) {
        console.error('can not find heading elements');
        return null;
    }

    const sections = [];
    headingElements.forEach(function (headingElement) {
        const section = {};

        const titleElement = headingElement.querySelector('.mw-headline');
        if (!titleElement) {
            console.error('can not find title element');
            return null;
        }
        section.title = titleElement.textContent;

        section.contentHtml = '';
        let nextElement = headingElement.nextElementSibling;
        let firstContentElementFound = false;

        while (nextElement && nextElement.tagName !== 'H2') {
            if (!firstContentElementFound) {
                section.firstContentElement = nextElement;
                firstContentElementFound = true;
            }

            section.contentHtml += nextElement.outerHTML;
            nextElement = nextElement.nextElementSibling;
        }

        sections.push(section);
    });

    return sections;
}
