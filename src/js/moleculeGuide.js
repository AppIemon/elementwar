// 분자 도감 및 검색 시스템

export class MoleculeGuide {
  constructor() {
    this.molecules = [];
    this.filteredMolecules = [];
    this.currentFilter = 'all';
    this.searchTerm = '';
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.discoveredMolecules = new Set();
    
    this.init();
  }

  async init() {
    await this.loadMolecules();
    this.setupEventListeners();
    this.loadDiscoveredMolecules();
  }

  async loadMolecules() {
    try {
      const response = await fetch('src/data/molecules.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.molecules = await response.json();
      this.filteredMolecules = [...this.molecules];
      console.log(`[MoleculeGuide] Loaded ${this.molecules.length} molecules`);
    } catch (error) {
      console.error('[MoleculeGuide] Failed to load molecules:', error);
      this.molecules = [];
      this.filteredMolecules = [];
      // 오류 발생 시 빈 목록 표시
      this.renderMoleculeList();
    }
  }

  loadDiscoveredMolecules() {
    // 로컬 스토리지에서 발견된 분자 목록 로드
    const discovered = localStorage.getItem('discoveredMolecules');
    if (discovered) {
      this.discoveredMolecules = new Set(JSON.parse(discovered));
    }
  }

  saveDiscoveredMolecules() {
    // 로컬 스토리지에 발견된 분자 목록 저장
    localStorage.setItem('discoveredMolecules', JSON.stringify([...this.discoveredMolecules]));
  }

  discoverMolecule(moleculeId) {
    this.discoveredMolecules.add(moleculeId);
    this.saveDiscoveredMolecules();
    this.updateMoleculeDiscoveryStatus();
  }

  setupEventListeners() {
    try {
      // 도감 열기 버튼
      const guideBtn = document.getElementById('molecule-guide-btn');
      if (guideBtn) {
        guideBtn.addEventListener('click', () => this.openGuide());
      } else {
        console.warn('[MoleculeGuide] molecule-guide-btn not found');
      }

      // 도감 닫기 버튼
      const closeBtn = document.getElementById('close-molecule-guide');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeGuide());
      } else {
        console.warn('[MoleculeGuide] close-molecule-guide not found');
      }

      // 검색 입력
      const searchInput = document.getElementById('molecule-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchTerm = e.target.value.toLowerCase();
          this.filterAndSort();
        });
      } else {
        console.warn('[MoleculeGuide] molecule-search not found');
      }

      // 필터 버튼들 (동적으로 추가된 버튼들을 위해 이벤트 위임 사용)
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('molecule-filter-btn')) {
          this.currentFilter = e.target.dataset.filter;
          this.updateFilterButtons();
          this.filterAndSort();
        }
      });

      // 정렬 버튼들 (동적으로 추가된 버튼들을 위해 이벤트 위임 사용)
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('molecule-sort-btn')) {
          const sortBy = e.target.dataset.sort;
          if (this.sortBy === sortBy) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
          } else {
            this.sortBy = sortBy;
            this.sortOrder = 'asc';
          }
          this.updateSortButtons();
          this.filterAndSort();
        }
      });

      // 자세히 보기 버튼들 (이벤트 위임 사용)
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('molecule-detail-btn')) {
          const moleculeId = e.target.dataset.moleculeId;
          if (moleculeId) {
            this.showMoleculeDetail(moleculeId);
          }
        }
      });


      // 분자 상세 모달 닫기 버튼
      const closeMoleculeViewer = document.getElementById('close-molecule-viewer');
      if (closeMoleculeViewer) {
        closeMoleculeViewer.addEventListener('click', () => {
          const modal = document.getElementById('molecule-viewer-modal');
          if (modal) {
            modal.classList.add('hidden');
          }
        });
      } else {
        console.warn('[MoleculeGuide] close-molecule-viewer not found');
      }

      // 모달 외부 클릭 시 닫기
      document.addEventListener('click', (e) => {
        const guideModal = document.getElementById('molecule-guide-modal');
        const viewerModal = document.getElementById('molecule-viewer-modal');
        
        if (e.target === guideModal) {
          this.closeGuide();
        }
        
        if (e.target === viewerModal) {
          viewerModal.classList.add('hidden');
        }
      });

      console.log('[MoleculeGuide] Event listeners setup completed');
    } catch (error) {
      console.error('[MoleculeGuide] Error setting up event listeners:', error);
    }
  }

  openGuide() {
    const modal = document.getElementById('molecule-guide-modal');
    if (modal) {
      modal.classList.remove('hidden');
      this.renderGuide();
    }
  }

  closeGuide() {
    const modal = document.getElementById('molecule-guide-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  renderGuide() {
    this.renderMoleculeList();
    this.updateFilterButtons();
    this.updateSortButtons();
    this.updateDiscoveryProgress();
  }

  renderMoleculeList() {
    const container = document.getElementById('molecule-list');
    if (!container) {
      console.error('[MoleculeGuide] molecule-list container not found');
      return;
    }

    if (this.filteredMolecules.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-400 py-8">
          <i class="fas fa-search text-4xl mb-4"></i>
          <p>검색 결과가 없습니다.</p>
        </div>
      `;
      return;
    }

    try {
      container.innerHTML = this.filteredMolecules.map(molecule => 
        this.createMoleculeCard(molecule)
      ).join('');
    } catch (error) {
      console.error('[MoleculeGuide] Error rendering molecule list:', error);
      container.innerHTML = `
        <div class="text-center text-red-400 py-8">
          <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
          <p>분자 목록을 표시하는 중 오류가 발생했습니다.</p>
        </div>
      `;
    }
  }

  createMoleculeCard(molecule) {
    try {
      const isDiscovered = this.discoveredMolecules.has(molecule.id);
      const discoveryClass = isDiscovered ? '' : 'opacity-50';
      const discoveryIcon = isDiscovered ? 'fas fa-check-circle text-green-400' : 'fas fa-question-circle text-gray-400';
      
      // 안전한 데이터 접근을 위한 기본값 설정
      const name = molecule.name || '알 수 없는 분자';
      const symbol = molecule.symbol || '?';
      const formula = molecule.formula || '?';
      const description = molecule.description || '설명이 없습니다.';
      const category = molecule.category || '기타';
      const rarity = molecule.rarity || 'common';
      const color = molecule.color || 'bg-gray-600';
      const baseStats = molecule.baseStats || { atk: 0, hp: 0 };
      // 특수능력 처리
      let specialAbilitiesText = '특수 효과 없음';
      if (molecule.specialAbilities && Array.isArray(molecule.specialAbilities) && molecule.specialAbilities.length > 0) {
        specialAbilitiesText = molecule.specialAbilities.map(ability => ability.text || ability.name).join(', ');
      }
      
      return `
        <div class="molecule-card bg-gray-700 rounded-lg p-4 mb-4 ${discoveryClass}" data-molecule-id="${molecule.id}">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 ${color} rounded-full flex items-center justify-center text-white font-bold text-sm">
                ${symbol}
              </div>
              <div>
                <h3 class="text-lg font-bold text-white">${name}</h3>
                <p class="text-sm text-gray-400">${formula}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <i class="${discoveryIcon}"></i>
              <span class="px-2 py-1 text-xs rounded-full ${this.getRarityColor(rarity)}">
                ${this.getRarityText(rarity)}
              </span>
            </div>
          </div>
          
          <p class="text-gray-300 text-sm mb-3">${description}</p>
          
          <div class="grid grid-cols-2 gap-4 mb-3">
            <div class="bg-gray-800 rounded p-2">
              <div class="text-xs text-gray-400 mb-1">기본 능력치</div>
              <div class="text-sm">
                <span class="text-red-400">⚔ ${formatNumber(baseStats.atk)}</span>
                <span class="ml-2 text-blue-400">❤ ${formatNumber(baseStats.hp)}</span>
              </div>
            </div>
            <div class="bg-gray-800 rounded p-2">
              <div class="text-xs text-gray-400 mb-1">특수 효과</div>
              <div class="text-sm text-yellow-400">${specialAbilitiesText}</div>
            </div>
          </div>
          
          <div class="flex justify-between items-center">
            <div class="text-xs text-gray-400">
              <span class="px-2 py-1 bg-gray-600 rounded">${category}</span>
            </div>
            <div class="flex gap-2">
              <button class="molecule-detail-btn text-blue-400 hover:text-blue-300 text-sm" data-molecule-id="${molecule.id}">
                자세히 보기
              </button>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('[MoleculeGuide] Error creating molecule card:', error, molecule);
      return `
        <div class="molecule-card bg-red-900 rounded-lg p-4 mb-4">
          <div class="text-center text-red-400">
            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <p>분자 정보를 표시할 수 없습니다.</p>
          </div>
        </div>
      `;
    }
  }

  getRarityColor(rarity) {
    const colors = {
      'common': 'bg-gray-500 text-white',
      'uncommon': 'bg-green-500 text-white',
      'rare': 'bg-blue-500 text-white',
      'epic': 'bg-purple-500 text-white',
      'legendary': 'bg-yellow-500 text-black'
    };
    return colors[rarity] || colors['common'];
  }

  getRarityText(rarity) {
    const texts = {
      'common': '일반',
      'uncommon': '고급',
      'rare': '희귀',
      'epic': '영웅',
      'legendary': '전설'
    };
    return texts[rarity] || '일반';
  }

  filterAndSort() {
    try {
      // 필터링
      let filtered = this.molecules.filter(molecule => {
        try {
          // 검색어 필터
          if (this.searchTerm) {
            const searchFields = [
              molecule.name || '',
              molecule.symbol || '',
              molecule.formula || '',
              molecule.description || '',
              molecule.category || ''
            ];
            const matchesSearch = searchFields.some(field => 
              field.toLowerCase().includes(this.searchTerm)
            );
            if (!matchesSearch) return false;
          }

          // 카테고리 필터
          if (this.currentFilter !== 'all') {
            if (this.currentFilter === 'discovered') {
              return this.discoveredMolecules.has(molecule.id);
            } else if (this.currentFilter === 'undiscovered') {
              return !this.discoveredMolecules.has(molecule.id);
            } else {
              return (molecule.category || '') === this.currentFilter;
            }
          }

          return true;
        } catch (error) {
          console.error('[MoleculeGuide] Error filtering molecule:', error, molecule);
          return false;
        }
      });

      // 정렬
      filtered.sort((a, b) => {
        try {
          let aValue, bValue;
          
          switch (this.sortBy) {
            case 'name':
              aValue = (a.name || '').toLowerCase();
              bValue = (b.name || '').toLowerCase();
              break;
            case 'rarity':
              const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
              aValue = rarityOrder.indexOf(a.rarity || 'common');
              bValue = rarityOrder.indexOf(b.rarity || 'common');
              break;
            case 'atk':
              aValue = (a.baseStats || {}).atk || 0;
              bValue = (b.baseStats || {}).atk || 0;
              break;
            case 'hp':
              aValue = (a.baseStats || {}).hp || 0;
              bValue = (b.baseStats || {}).hp || 0;
              break;
            default:
              aValue = (a.name || '').toLowerCase();
              bValue = (b.name || '').toLowerCase();
          }

          if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
          if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
          return 0;
        } catch (error) {
          console.error('[MoleculeGuide] Error sorting molecules:', error);
          return 0;
        }
      });

      this.filteredMolecules = filtered;
      this.renderMoleculeList();
    } catch (error) {
      console.error('[MoleculeGuide] Error in filterAndSort:', error);
      this.filteredMolecules = [];
      this.renderMoleculeList();
    }
  }

  updateFilterButtons() {
    const buttons = document.querySelectorAll('.molecule-filter-btn');
    buttons.forEach(btn => {
      if (btn.dataset.filter === this.currentFilter) {
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('bg-gray-600', 'text-gray-300');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-600', 'text-gray-300');
      }
    });
  }

  updateSortButtons() {
    const buttons = document.querySelectorAll('.molecule-sort-btn');
    buttons.forEach(btn => {
      if (btn.dataset.sort === this.sortBy) {
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('bg-gray-600', 'text-gray-300');
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        }
      } else {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-600', 'text-gray-300');
      }
    });
  }

  updateMoleculeDiscoveryStatus() {
    const cards = document.querySelectorAll('.molecule-card');
    cards.forEach(card => {
      const moleculeId = card.dataset.moleculeId;
      const isDiscovered = this.discoveredMolecules.has(moleculeId);
      
      if (isDiscovered) {
        card.classList.remove('opacity-50');
        const icon = card.querySelector('.fa-question-circle');
        if (icon) {
          icon.className = 'fas fa-check-circle text-green-400';
        }
      } else {
        card.classList.add('opacity-50');
        const icon = card.querySelector('.fa-check-circle');
        if (icon) {
          icon.className = 'fas fa-question-circle text-gray-400';
        }
      }
    });
    this.updateDiscoveryProgress();
  }

  updateDiscoveryProgress() {
    const progress = this.getDiscoveryProgress();
    const discoveredCount = document.getElementById('discovered-count');
    const totalCount = document.getElementById('total-count');
    const discoveryPercentage = document.getElementById('discovery-percentage');
    
    if (discoveredCount) discoveredCount.textContent = formatNumber(progress.discovered);
    if (totalCount) totalCount.textContent = formatNumber(progress.total);
    if (discoveryPercentage) discoveryPercentage.textContent = progress.percentage;
  }

  getMoleculeById(id) {
    return this.molecules.find(molecule => molecule.id === id);
  }

  getMoleculesByCategory(category) {
    return this.molecules.filter(molecule => molecule.category === category);
  }

  searchMolecules(query) {
    this.searchTerm = query.toLowerCase();
    this.filterAndSort();
  }

  getDiscoveryProgress() {
    const total = this.molecules.length;
    const discovered = this.discoveredMolecules.size;
    return {
      discovered,
      total,
      percentage: Math.round((discovered / total) * 100)
    };
  }

  showMoleculeDetail(moleculeId) {
    try {
      const molecule = this.getMoleculeById(moleculeId);
      if (!molecule) {
        console.error('[MoleculeGuide] Molecule not found:', moleculeId);
        return;
      }

      const modal = document.getElementById('molecule-viewer-modal');
      const content = document.getElementById('molecule-viewer-content');
      
      if (!modal || !content) {
        console.error('[MoleculeGuide] Modal elements not found');
        return;
      }

      const isDiscovered = this.discoveredMolecules.has(moleculeId);
      
      // 안전한 데이터 접근을 위한 기본값 설정
      const name = molecule.name || '알 수 없는 분자';
      const symbol = molecule.symbol || '?';
      const formula = molecule.formula || '?';
      const description = molecule.description || '설명이 없습니다.';
      const category = molecule.category || '기타';
      const rarity = molecule.rarity || 'common';
      const color = molecule.color || 'bg-gray-600';
      const baseStats = molecule.baseStats || { atk: 0, hp: 0 };
      // 특수능력 처리
      let specialAbilitiesText = '특수 효과 없음';
      if (molecule.specialAbilities && Array.isArray(molecule.specialAbilities) && molecule.specialAbilities.length > 0) {
        specialAbilitiesText = molecule.specialAbilities.map(ability => ability.text || ability.name).join(', ');
      }
      const elementCounts = molecule.elementCounts || {};
      
      content.innerHTML = `
        <div class="text-center">
          <div class="w-24 h-24 ${color} rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            ${symbol}
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">${name}</h3>
          <p class="text-lg text-gray-400 mb-4">${formula}</p>
          
          ${!isDiscovered ? `
            <div class="bg-yellow-900 border border-yellow-600 rounded-lg p-3 mb-4">
              <i class="fas fa-lock text-yellow-400 mr-2"></i>
              <span class="text-yellow-300">이 분자를 아직 발견하지 못했습니다.</span>
            </div>
          ` : ''}
          
          <div class="text-left space-y-4">
            <div>
              <h4 class="text-lg font-bold text-blue-300 mb-2">설명</h4>
              <p class="text-gray-300">${description}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gray-700 rounded-lg p-3">
                <h4 class="text-lg font-bold text-green-300 mb-2">기본 능력치</h4>
                <div class="space-y-1">
                  <div class="flex justify-between">
                    <span class="text-gray-400">공격력:</span>
                    <span class="text-red-400 font-bold">${formatNumber(baseStats.atk)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">체력:</span>
                    <span class="text-blue-400 font-bold">${formatNumber(baseStats.hp)}</span>
                  </div>
                </div>
              </div>
              
              <div class="bg-gray-700 rounded-lg p-3">
                <h4 class="text-lg font-bold text-purple-300 mb-2">특수 효과</h4>
                <p class="text-yellow-400 text-sm">${specialAbilitiesText}</p>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gray-700 rounded-lg p-3">
                <h4 class="text-lg font-bold text-cyan-300 mb-2">구성 원소</h4>
                <div class="flex flex-wrap gap-1">
                  ${Object.keys(elementCounts).length > 0 ? 
                    Object.entries(elementCounts).map(([element, count]) => 
                      `<span class="px-2 py-1 bg-gray-600 rounded text-sm">${element}${count > 1 ? count : ''}</span>`
                    ).join('') : 
                    '<span class="text-gray-400 text-sm">정보 없음</span>'
                  }
                </div>
              </div>
              
              <div class="bg-gray-700 rounded-lg p-3">
                <h4 class="text-lg font-bold text-orange-300 mb-2">분류</h4>
                <div class="flex items-center">
                  <span class="px-3 py-1 ${this.getRarityColor(rarity)} rounded-full text-sm mr-2">
                    ${this.getRarityText(rarity)}
                  </span>
                  <span class="px-3 py-1 bg-gray-600 rounded-full text-sm">
                    ${category}
                  </span>
                </div>
              </div>
            </div>
            
            ${isDiscovered ? `
              <div class="bg-green-900 border border-green-600 rounded-lg p-3">
                <i class="fas fa-check-circle text-green-400 mr-2"></i>
                <span class="text-green-300">이 분자를 발견했습니다!</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      modal.classList.remove('hidden');
    } catch (error) {
      console.error('[MoleculeGuide] Error showing molecule detail:', error);
    }
  }

}

// 전역 인스턴스 생성
let moleculeGuide = null;

// 초기화 함수
function initMoleculeGuide() {
  try {
    console.log('[MoleculeGuide] Starting initialization...');
    if (moleculeGuide) {
      console.log('[MoleculeGuide] Already initialized');
      return;
    }
    
    moleculeGuide = new MoleculeGuide();
    console.log('[MoleculeGuide] Initialized successfully');
  } catch (error) {
    console.error('[MoleculeGuide] Failed to initialize:', error);
    console.error('[MoleculeGuide] Error stack:', error.stack);
    throw error;
  }
}

// 분자 발견 함수 (게임에서 호출)
function discoverMolecule(moleculeId) {
  if (moleculeGuide) {
    moleculeGuide.discoverMolecule(moleculeId);
  }
}

// 분자 검색 함수
function searchMolecules(query) {
  if (moleculeGuide) {
    moleculeGuide.searchMolecules(query);
  }
}

// Export functions for module imports
export {
  initMoleculeGuide,
  discoverMolecule,
  searchMolecules,
  moleculeGuide
};

// 전역 함수로 노출
window.initMoleculeGuide = initMoleculeGuide;
window.discoverMolecule = discoverMolecule;
window.searchMolecules = searchMolecules;
window.moleculeGuide = moleculeGuide;
