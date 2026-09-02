(() => {
  'use strict';

  const NAV_BREAKPOINT = 1024;
  const MIN_ITEM_WIDTH = 68;
  const SECTION_BY_KEY = {
    works: 'bestPracticeBox',
    courses: 'cliproomBox',
    shop: 'learningBaseModule'
  };
  const ACTIVE_SECTION_BY_KEY = {
    home: 'home',
    works: 'bestPracticeBox',
    courses: 'cliproomBox',
    shop: 'learningBaseModule'
  };

  const WORK_ITEMS = [
    ['Best Practice', 'best_practice.html'],
    ['สื่อ/นวัตกรรม', 'innovation.html'],
    ['คลังสื่อการสอน', 'media.html'],
    ['รางวัล เกียรติบัตร', 'reward.html'],
    ['คลังหลักสูตร', 'course.html']
  ];

  const byId = id => document.getElementById(id);
  const isMobile = () => window.innerWidth <= NAV_BREAKPOINT;

  function init() {
    const nav = byId('mobileBottomNav');
    const primary = byId('mobileBottomPrimary');
    const more = byId('mobileBottomMore');
    const panel = byId('mobileBottomPanel');
    const panelTitle = byId('mobileBottomPanelTitle');
    const panelList = byId('mobileBottomPanelList');
    const panelBack = byId('mobileBottomPanelBack');
    const panelClose = byId('mobileBottomPanelClose');
    if (!nav || !primary || !more || !panel || !panelTitle || !panelList) return;

    const allItems = Array.from(primary.querySelectorAll('[data-mobile-nav-item]'));
    let overflowItems = [];
    let panelMode = '';
    let lastOverflow = [];
    let resizeTimer = 0;

    const getKey = el => String(el?.dataset?.navKey || '');

    function sectionVisible(sectionId) {
      if (!sectionId) return true;
      const section = byId(sectionId);
      if (!section) return false;
      return section.dataset.sectionVisible !== 'false';
    }

    function syncSectionVisibility() {
      allItems.forEach(item => {
        const sectionId = item.dataset.sectionId || SECTION_BY_KEY[getKey(item)] || '';
        item.dataset.sectionAllowed = sectionVisible(sectionId) ? 'true' : 'false';
      });
      layout();
    }

    function allowedItems() {
      return allItems.filter(item => item.dataset.sectionAllowed !== 'false');
    }

    function closePanel() {
      panel.hidden = true;
      panelMode = '';
      panelBack.hidden = true;
      more.setAttribute('aria-expanded', 'false');
      allItems.forEach(item => {
        if (item.matches('button')) item.setAttribute('aria-expanded', 'false');
      });
    }

    function makeLink(label, href, options = {}) {
      const a = document.createElement('a');
      a.className = 'mobile-bottom-panel-item';
      a.textContent = label;
      a.href = href;
      if (/^https?:\/\//i.test(href)) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      if (options.iconClass) {
        const i = document.createElement('i');
        i.className = options.iconClass;
        i.setAttribute('aria-hidden', 'true');
        a.prepend(i);
      }
      a.addEventListener('click', closePanel);
      return a;
    }

    function getDynamicMenu(sourceId) {
      const source = byId(sourceId);
      if (!source) return [];
      return Array.from(source.querySelectorAll('a[href]')).map(a => ({
        label: (a.textContent || '').trim(),
        href: a.getAttribute('href') || ''
      })).filter(row => row.label && row.href);
    }

    function submenuFor(key) {
      if (key === 'works') {
        return WORK_ITEMS.map(([label, href]) => ({ label, href }));
      }
      if (key === 'district') return getDynamicMenu('districtMenuList');
      if (key === 'library') return getDynamicMenu('libraryMenuList');
      return [];
    }

    function menuTitle(key) {
      return {
        works: 'ผลงานของเรา',
        district: 'สกร.ระดับตำบล',
        library: 'ห้องสมุด'
      }[key] || 'เมนู';
    }

    function showSubmenu(key, fromOverflow = false) {
      const rows = submenuFor(key);
      panelMode = key;
      panelTitle.textContent = menuTitle(key);
      panelList.replaceChildren();
      panelBack.hidden = !fromOverflow;

      if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'mobile-bottom-panel-empty';
        empty.textContent = 'ยังไม่มีข้อมูล';
        panelList.appendChild(empty);
      } else {
        rows.forEach(row => panelList.appendChild(makeLink(row.label, row.href)));
      }

      panel.hidden = false;
      allItems.forEach(item => {
        if (item.matches('button')) {
          item.setAttribute('aria-expanded', getKey(item) === key ? 'true' : 'false');
        }
      });
      more.setAttribute('aria-expanded', 'false');
    }

    function makeOverflowRow(item) {
      const key = getKey(item);
      const label = (item.querySelector('span')?.textContent || item.textContent || '').trim();
      const icon = item.querySelector('i')?.className || '';

      if (item.tagName === 'A') {
        return makeLink(label, item.getAttribute('href') || '#', { iconClass: icon });
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mobile-bottom-panel-item mobile-bottom-panel-submenu-trigger';
      if (icon) {
        const i = document.createElement('i');
        i.className = icon;
        i.setAttribute('aria-hidden', 'true');
        button.appendChild(i);
      }
      const text = document.createElement('span');
      text.textContent = label;
      button.appendChild(text);
      const chevron = document.createElement('i');
      chevron.className = 'fa fa-angle-right mobile-bottom-panel-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      button.appendChild(chevron);
      button.addEventListener('click', () => showSubmenu(key, true));
      return button;
    }

    function showOverflow() {
      panelMode = 'overflow';
      panelTitle.textContent = 'เมนูเพิ่มเติม';
      panelBack.hidden = true;
      panelList.replaceChildren();
      lastOverflow.forEach(item => panelList.appendChild(makeOverflowRow(item)));
      panel.hidden = false;
      more.setAttribute('aria-expanded', 'true');
      allItems.forEach(item => {
        if (item.matches('button')) item.setAttribute('aria-expanded', 'false');
      });
    }

    function layout() {
      if (!isMobile()) {
        allItems.forEach(item => {
          item.hidden = item.dataset.sectionAllowed === 'false';
          item.classList.remove('mobile-bottom-overflowed');
        });
        more.hidden = true;
        closePanel();
        return;
      }

      const visible = allowedItems();
      const width = Math.max(0, primary.clientWidth || nav.clientWidth || window.innerWidth);
      const maxSlots = Math.max(3, Math.floor(width / MIN_ITEM_WIDTH));
      const needsOverflow = visible.length > maxSlots;
      const directCount = needsOverflow ? Math.max(2, maxSlots - 1) : visible.length;
      overflowItems = needsOverflow ? visible.slice(directCount) : [];
      lastOverflow = overflowItems.slice();

      allItems.forEach(item => {
        const allowed = item.dataset.sectionAllowed !== 'false';
        const overflowed = overflowItems.includes(item);
        item.hidden = !allowed || overflowed;
        item.classList.toggle('mobile-bottom-overflowed', overflowed);
      });
      more.hidden = !needsOverflow;

      const columnCount = directCount + (needsOverflow ? 1 : 0);
      primary.style.setProperty('--mobile-nav-columns', String(Math.max(1, columnCount)));

      if (!panel.hidden && panelMode === 'overflow') showOverflow();
      if (!panel.hidden && SECTION_BY_KEY[panelMode] && !sectionVisible(SECTION_BY_KEY[panelMode])) closePanel();
    }

    function setActiveBySection(sectionId) {
      const key = Object.keys(ACTIVE_SECTION_BY_KEY).find(k => ACTIVE_SECTION_BY_KEY[k] === sectionId);
      if (!key) return;
      allItems.forEach(item => item.classList.toggle('active', getKey(item) === key));
      more.classList.toggle('active', lastOverflow.some(item => getKey(item) === key));
    }

    allItems.forEach(item => {
      if (item.tagName === 'A') {
        item.addEventListener('click', () => {
          closePanel();
          const href = item.getAttribute('href') || '';
          if (href.startsWith('#')) setActiveBySection(href.slice(1));
        });
      } else {
        item.addEventListener('click', () => {
          const key = getKey(item);
          if (!panel.hidden && panelMode === key) closePanel();
          else showSubmenu(key, false);
        });
      }
    });

    more.addEventListener('click', () => {
      if (!panel.hidden && panelMode === 'overflow') closePanel();
      else showOverflow();
    });
    panelClose?.addEventListener('click', closePanel);
    panelBack?.addEventListener('click', showOverflow);

    document.addEventListener('click', event => {
      if (!panel.hidden && !nav.contains(event.target)) closePanel();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closePanel();
    });

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 90);
    }, { passive: true });

    document.addEventListener('sectionlayoutchange', syncSectionVisibility);

    ['bestPracticeBox', 'cliproomBox', 'learningBaseModule'].forEach(id => {
      const section = byId(id);
      if (!section) return;
      new MutationObserver(syncSectionVisibility).observe(section, {
        attributes: true,
        attributeFilter: ['data-section-visible']
      });
    });

    ['districtMenuList', 'libraryMenuList'].forEach(id => {
      const source = byId(id);
      if (!source) return;
      new MutationObserver(() => {
        if (!panel.hidden && (panelMode === 'district' || panelMode === 'library')) {
          showSubmenu(panelMode, panelBack.hidden === false);
        }
      }).observe(source, { childList: true, subtree: true });
    });

    const observer = new IntersectionObserver(entries => {
      const candidates = entries
        .filter(entry => entry.isIntersecting && sectionVisible(entry.target.id))
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (candidates.length) setActiveBySection(candidates[0].target.id);
    }, {
      root: null,
      rootMargin: '-18% 0px -62% 0px',
      threshold: [0.01, 0.1, 0.25]
    });

    Object.values(ACTIVE_SECTION_BY_KEY).forEach(id => {
      const section = byId(id);
      if (section) observer.observe(section);
    });

    syncSectionVisibility();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
