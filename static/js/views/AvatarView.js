import { gameState, PHASES } from '../state/GameState.js';
import { generateAvatarSVG, AVATAR_OPTIONS } from '../svg/AvatarSVG.js';
import { createPixelBox } from '../ui/PixelBox.js';
import { createRetroButton } from '../ui/RetroButton.js';

export class AvatarView {
  constructor(onConfirm) {
    this.onConfirm = onConfirm;
    this.activeTab = 'hair'; // 'hair' | 'skin' | 'outfit' | 'accessory'
  }

  render() {
    const state = gameState.getState();
    const config = state.playerConfig;

    this.container = document.createElement('div');
    this.container.className = 'avatar-view-container';

    // Title Box
    const header = document.createElement('div');
    header.className = 'avatar-header';
    header.innerHTML = `
      <h2 class="retro-sub-title">CHARACTER CREATOR</h2>
      <p style="font-size: 11px; opacity: 0.8; margin-top: 4px;">Sesuaikan Avatar RPG Pernikahan Anda</p>
    `;
    this.container.appendChild(header);

    // Layout Split: Preview Left | Selector Right
    const mainGrid = document.createElement('div');
    mainGrid.className = 'avatar-main-grid';

    // Preview Frame (Left)
    const previewBox = document.createElement('div');
    previewBox.className = 'pixel-box avatar-preview-box';
    
    const svgWrapper = document.createElement('div');
    svgWrapper.className = 'avatar-svg-bounce';
    svgWrapper.innerHTML = generateAvatarSVG(config, 140);
    previewBox.appendChild(svgWrapper);

    const nameLabel = document.createElement('div');
    nameLabel.className = 'avatar-preview-name';
    nameLabel.innerText = state.guestName;
    previewBox.appendChild(nameLabel);

    // Randomize Button
    const randBtn = createRetroButton({
      text: '🎲 RANDOMIZE',
      variant: 'secondary',
      className: 'avatar-rand-btn',
      onClick: () => {
        this.randomizeConfig();
        this.refresh();
      }
    });
    previewBox.appendChild(randBtn);

    mainGrid.appendChild(previewBox);

    // Options Control Panel (Right)
    const panelBox = document.createElement('div');
    panelBox.className = 'pixel-box avatar-options-box';

    // Navigation Tabs
    const tabsRow = document.createElement('div');
    tabsRow.className = 'avatar-tabs-row';

    const tabs = [
      { id: 'skin', label: 'SKIN' },
      { id: 'hair', label: 'HAIR' },
      { id: 'outfit', label: 'OUTFIT' },
      { id: 'accessory', label: 'EXTRA' }
    ];

    tabs.forEach(tab => {
      const tabBtn = document.createElement('button');
      tabBtn.className = `avatar-tab-btn ${this.activeTab === tab.id ? 'active' : ''}`;
      tabBtn.innerText = tab.label;
      tabBtn.addEventListener('click', () => {
        this.activeTab = tab.id;
        this.refresh();
      });
      tabsRow.appendChild(tabBtn);
    });

    panelBox.appendChild(tabsRow);

    // Options Content Area
    const optionsContent = document.createElement('div');
    optionsContent.className = 'avatar-options-content';
    optionsContent.appendChild(this.renderTabContent());
    panelBox.appendChild(optionsContent);

    mainGrid.appendChild(panelBox);
    this.container.appendChild(mainGrid);

    // Footer Actions
    const actionsRow = document.createElement('div');
    actionsRow.className = 'avatar-actions-row';

    const confirmBtn = createRetroButton({
      text: 'READY TO EXPLORE MAP 🚀',
      onClick: () => {
        if (typeof this.onConfirm === 'function') {
          this.onConfirm();
        } else {
          gameState.setPhase(PHASES.EXPLORATION);
        }
      }
    });

    actionsRow.appendChild(confirmBtn);
    this.container.appendChild(actionsRow);

    return this.container;
  }

  renderTabContent() {
    const config = gameState.getState().playerConfig;
    const content = document.createElement('div');
    content.className = 'avatar-picker-grid';

    if (this.activeTab === 'skin') {
      AVATAR_OPTIONS.skinColors.forEach(item => {
        const btn = document.createElement('div');
        btn.className = `skin-swatch ${config.skinColor === item.value ? 'selected' : ''}`;
        btn.style.backgroundColor = item.value;
        btn.title = item.label;
        btn.addEventListener('click', () => {
          gameState.updatePlayerConfig({ skinColor: item.value });
          this.refresh();
        });
        content.appendChild(btn);
      });
    } else if (this.activeTab === 'hair') {
      // Style Selector
      const styleGroup = document.createElement('div');
      styleGroup.className = 'option-group';
      styleGroup.innerHTML = '<label>Hair Style</label>';
      const styleGrid = document.createElement('div');
      styleGrid.className = 'options-pill-grid';

      AVATAR_OPTIONS.hairStyles.forEach(style => {
        const pill = document.createElement('button');
        pill.className = `option-pill ${config.hairStyle === style.id ? 'selected' : ''}`;
        pill.innerText = style.label;
        pill.addEventListener('click', () => {
          gameState.updatePlayerConfig({ hairStyle: style.id });
          this.refresh();
        });
        styleGrid.appendChild(pill);
      });
      styleGroup.appendChild(styleGrid);
      content.appendChild(styleGroup);

      // Color Selector
      const colorGroup = document.createElement('div');
      colorGroup.className = 'option-group';
      colorGroup.style.marginTop = '12px';
      colorGroup.innerHTML = '<label>Hair Color</label>';
      const colorGrid = document.createElement('div');
      colorGrid.className = 'options-swatch-grid';

      AVATAR_OPTIONS.hairColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = `skin-swatch ${config.hairColor === color.value ? 'selected' : ''}`;
        swatch.style.backgroundColor = color.value;
        swatch.title = color.label;
        swatch.addEventListener('click', () => {
          gameState.updatePlayerConfig({ hairColor: color.value });
          this.refresh();
        });
        colorGrid.appendChild(swatch);
      });
      colorGroup.appendChild(colorGrid);
      content.appendChild(colorGroup);
    } else if (this.activeTab === 'outfit') {
      AVATAR_OPTIONS.outfits.forEach(outfit => {
        const pill = document.createElement('button');
        pill.className = `option-pill ${config.outfit === outfit.id ? 'selected' : ''}`;
        pill.innerText = outfit.label;
        pill.addEventListener('click', () => {
          gameState.updatePlayerConfig({ outfit: outfit.id });
          this.refresh();
        });
        content.appendChild(pill);
      });
    } else if (this.activeTab === 'accessory') {
      AVATAR_OPTIONS.accessories.forEach(acc => {
        const pill = document.createElement('button');
        pill.className = `option-pill ${config.accessory === acc.id ? 'selected' : ''}`;
        pill.innerText = acc.label;
        pill.addEventListener('click', () => {
          gameState.updatePlayerConfig({ accessory: acc.id });
          this.refresh();
        });
        content.appendChild(pill);
      });
    }

    return content;
  }

  randomizeConfig() {
    const skins = AVATAR_OPTIONS.skinColors.map(s => s.value);
    const styles = AVATAR_OPTIONS.hairStyles.map(h => h.id);
    const hairCols = AVATAR_OPTIONS.hairColors.map(c => c.value);
    const outfits = AVATAR_OPTIONS.outfits.map(o => o.id);
    const accs = AVATAR_OPTIONS.accessories.map(a => a.id);

    gameState.updatePlayerConfig({
      skinColor: skins[Math.floor(Math.random() * skins.length)],
      hairStyle: styles[Math.floor(Math.random() * styles.length)],
      hairColor: hairCols[Math.floor(Math.random() * hairCols.length)],
      outfit: outfits[Math.floor(Math.random() * outfits.length)],
      accessory: accs[Math.floor(Math.random() * accs.length)]
    });
  }

  refresh() {
    if (this.container && this.container.parentElement) {
      const parent = this.container.parentElement;
      const newElem = this.render();
      parent.replaceChild(newElem, this.container);
    }
  }
}
