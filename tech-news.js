const TechNewsTicker = {
  feedUrl: 'https://tldr.tech/api/rss/tech',

  parseFeed(xml) {
    const feed = new DOMParser().parseFromString(xml, 'application/xml');
    if (feed.querySelector('parsererror')) throw new Error('TLDR returned an invalid RSS feed');

    const stories = [];
    const seen = new Set();
    for (const item of feed.querySelectorAll('channel > item')) {
      const title = item.querySelector('title')?.textContent.trim();
      const link = item.querySelector('link')?.textContent.trim();
      if (!title || !link || !URL.canParse(link)) continue;
      const url = new URL(link);
      if (url.protocol !== 'https:' || url.hostname !== 'tldr.tech' || url.username || url.password || seen.has(url.href)) continue;
      seen.add(url.href);
      stories.push({ title, link: url.href });
      if (stories.length === 10) break;
    }
    if (stories.length === 0) throw new Error('TLDR RSS feed contains no usable headlines');
    return stories;
  },

  init() {
    this.container = document.getElementById('techNewsTicker');
    if (!this.container) return;
    this.viewport = this.container.querySelector('.tech-news-viewport');
    this.pauseButton = this.container.querySelector('.tech-news-pause');
    this.pauseButton.addEventListener('click', () => {
      const paused = this.container.classList.toggle('is-paused');
      this.pauseButton.textContent = paused ? 'Resume' : 'Pause';
      this.pauseButton.setAttribute('aria-pressed', String(paused));
      this.pauseButton.setAttribute('aria-label', paused ? 'Resume tech news scrolling' : 'Pause tech news scrolling');
    });
    this.showStatus('Loading tech news...');
    this.update();
    window.setInterval(() => this.update(), 3600000);
  },

  showStatus(message) {
    const status = document.createElement('a');
    status.className = 'tech-news-status';
    status.href = 'https://tldr.tech/';
    status.target = '_blank';
    status.rel = 'noopener noreferrer';
    status.textContent = message;
    this.viewport.replaceChildren(status);
    this.pauseButton.hidden = true;
  },

  render(stories) {
    const track = document.createElement('div');
    track.className = 'tech-news-track';
    const group = document.createElement('div');
    group.className = 'tech-news-group';
    for (const story of stories) {
      const link = document.createElement('a');
      link.className = 'tech-news-item';
      link.href = story.link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = story.title;
      group.appendChild(link);
    }
    const duplicate = group.cloneNode(true);
    duplicate.setAttribute('aria-hidden', 'true');
    duplicate.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
    track.append(group, duplicate);
    this.viewport.replaceChildren(track);
    this.container.style.setProperty('--tech-news-duration', `${Math.max(group.scrollWidth / 50, 30)}s`);
    this.pauseButton.hidden = false;
  },

  async update() {
    try {
      const response = await fetch(this.feedUrl, {
        cache: 'no-cache',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error(`TLDR request failed with status ${response.status}`);
      this.render(this.parseFeed(await response.text()));
    } catch (error) {
      console.error('Error loading TLDR tech news:', error);
      this.showStatus('Tech news unavailable. Read TLDR');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => TechNewsTicker.init());
