window.h2Sections = [];

initializeSectionSummarizer();

/**
 * Initializes the summarization feature on suitable pages.
 */
function initializeSectionSummarizer() {
    if (!isPageSuitable()) {
        console.error('This page is not suitable for the Section Summarizer');
    } else {
        var mainElement = getMainElement();
        if (!mainElement) {
            console.error('Section Summarizer could not find the main article element');
        } else {
            window.h2Sections = getH2Sections(mainElement);
            if (window.h2Sections.length === 0) {
                console.error('Section Summarizer could not find suitable sections');
            } else {
                injectSummaryWidgets(window.h2Sections);
            }
        }
    }
}

/**
 * Determines if the current page is suitable for the script.
 *
 * @returns {boolean} True if the page is suitable, false otherwise.
 */
function isPageSuitable() {
    return true;
    return (
        mw.config.get('wgArticleId') !== 0 &&
        mw.config.get('wgCurRevisionId') === mw.config.get('wgRevisionId') &&
        mw.config.get('wgAction') === 'view'
    );
}

/**
 * Finds the main content of a MediaWiki article.
 *
 * @returns {Element|null} The main content element of the article or null if not found.
 */
function getMainElement() {
    return document.querySelector('#mw-content-text > .mw-parser-output') || null;
}

/**
 * Extracts H2 sections from a MediaWiki article element.
 *
 * @param {HTMLElement} articleElement - The article element containing the H2 sections.
 * @param {number} [minChars=100] - The minimum number of characters a section must have to be included in the output.
 * @returns {Array} An array of objects representing the H2 sections, each containing:
 *   - title (string): The plain text title of the H2 section.
 *   - contentHtml (string): The HTML content between the current H2 and the next H2 or the end of the article.
 *   - contentPlain (string): The plain text content between the current H2 and the next H2 or the end of the article.
 *   - length (number): The character count of the plain text content (contentPlain).
 *   - h2Element (Element): A link to the H2 DOM element.
 *   - firstContentElement (Element|null): A link to the first element of the content or null if there is no content.
 */
function getH2Sections(articleElement, minChars) {
    minChars = minChars || 500;
    var h2Sections = [];
    var h2Elements = articleElement.querySelectorAll('h2');

    Array.prototype.forEach.call(h2Elements, function (h2, index) {
        if (h2.id === 'mw-toc-heading') {
            return;
        }

        var title = h2.querySelector('.mw-headline').textContent;
        var contentElements = [];
        var contentPlain = '';
        var nextElement = h2.nextElementSibling;

        while (nextElement && nextElement.tagName !== 'H2') {
            contentElements.push(nextElement);
            contentPlain += nextElement.textContent;
            nextElement = nextElement.nextElementSibling;
        }

        var contentHtml = contentElements.map(function (el) {
            return el.outerHTML;
        }).join('');
        var length = contentPlain.length;
        var firstContentElement = contentElements.length > 0 ? contentElements[0] : null;

        // Check if the firstContentElement is a <section> tag and find the first element inside of it
        if (firstContentElement && firstContentElement.tagName === 'SECTION') {
            firstContentElement = firstContentElement.firstElementChild;
        }

        if (length >= minChars) {
            h2Sections.push({
                title: title,
                contentElements: contentElements,
                contentHtml: contentHtml,
                contentPlain: contentPlain,
                length: length,
                h2Element: h2,
                firstContentElement: firstContentElement
            });
        }
    });

    return h2Sections;
}

/**
 * Injects a summary widget before the first content element of each H2 section.
 * The widget has three states: collapsed, loading, and completed.
 * When the "Summarize this section" link is clicked, the widget enters the loading state,
 * and the summarizeContent function is called to generate a summary.
 * After the summary is generated, the widget enters the completed state and displays the summary.
 *
 * @param {Array} h2Sections - An array of H2 section objects as returned by getH2Sections().
 */
function injectSummaryWidgets(h2Sections) {
    h2Sections.forEach(function (section, index) {
        if (section.firstContentElement) {
            var widget = document.createElement('div');
            widget.className = 'section-summary-widget collapsed';
            widget.dataset.h2sectionIndex = index;

            widget.innerHTML = [
                '<div class="section-summary-widget__collapsed">',
                '    <a href="#">Summarize this section</a>',
                '</div>',
                '<div class="section-summary-widget__loading">',
                '    <div>Summarizing the section...</div>',
                '</div>',
                '<div class="section-summary-widget__completed">',
                '    <div class="section-summary-widget__summary"></div>',
                '    <div class="section-summary-widget__disclaimer">',
                '        This summary was generated by AI and can contain errors.',
                '    </div>',
                '</div>',
                '<div class="section-summary-widget__error"></div>'
            ].join('');

            section.firstContentElement.parentNode.insertBefore(widget, section.firstContentElement);

            var collapsedLink = widget.querySelector('.section-summary-widget__collapsed a');
            collapsedLink.addEventListener('click', function (event) {
                event.preventDefault();
                widget.classList.remove('collapsed');
                widget.classList.add('loading');

                summarizeContent(section.contentPlain).then(function (summary) {
                    var summaryDiv = widget.querySelector('.section-summary-widget__summary');
                    summaryDiv.textContent = summary;
                    widget.classList.remove('loading');
                    widget.classList.add('completed');
                }).catch(function (error) {
                    var errorDiv = widget.querySelector('.section-summary-widget__error');
                    errorDiv.textContent = 'Error: ' + error;
                    widget.classList.remove('loading');
                    widget.classList.add('error');
                });
            });
        }
    });
}

function summarizeContent(content) {
    return new Promise(function (resolve, reject) {
        var openAiKey = getOpenAiKey();

        if (!openAiKey) {
            reject('OpenAI API key not found or invalid');
            return;
        }

        fetchSummaryUsingOpenAPI(openAiKey, content, function (error, summary) {
            if (error) {
                reject(error);
            } else {
                resolve(summary);
            }
        });
    });
}


function fetchSummaryUsingOpenAPI(openAPIKey, sectionText, callback) {
    const fixedPromptForChatGPT = "Summarize the following section in 30 words:  ";
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.openai.com/v1/chat/completions", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + openAPIKey);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                const responseContent = response.choices[0].message.content;
                callback(null, responseContent);
            } else {
                callback(xhr.statusText);
            }
        }
    };
    xhr.send(JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "user",
                content: fixedPromptForChatGPT + sectionText,
            }
        ],
        temperature: 0
    }));
}

function getOpenAiKey() {
    var openAiKey = localStorage.getItem('openAiKey');

    if (!openAiKey) {
        var userInput = prompt('Please enter your OpenAI API key (it should start with "sk-"):');

        if (userInput && userInput.startsWith('sk-')) {
            openAiKey = userInput;
            localStorage.setItem('openAiKey', openAiKey);
        } else {
            console.error('Invalid OpenAI API key provided.');
            return null;
        }
    }

    return openAiKey;
}
