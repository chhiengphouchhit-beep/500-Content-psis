
    let currentUser = { name: 'Chhit', role: 'Admin' };
    let currentStatusFilter = 'ALL';
    let currentFilter = 'ALL';
    let activeTgCard = null;
    const telegramManagerChatId = "6654734966";

    // Performance Optimization: Pagination / Batch Render
    let displayLimit = 20;

    function switchUser(name, role) {
      currentUser = { name, role };
      localStorage.setItem('psis_current_user', JSON.stringify(currentUser));

      const btnChhit = document.getElementById('userBtnChhit');
      const btnSivleng = document.getElementById('userBtnSivleng');
      const welcomeSubtitle = document.getElementById('userWelcomeSubtitle');

      if (name === 'Chhit') {
        btnChhit.classList.add('active');
        btnSivleng.classList.remove('active');
        welcomeSubtitle.innerHTML = `សូមស្វាគមន៍លោក <strong>Chhit (Admin)</strong> មកកាន់ប្រព័ន្ធគ្រប់គ្រងមាតិកា!`;
      } else {
        btnSivleng.classList.add('active');
        btnChhit.classList.remove('active');
        welcomeSubtitle.innerHTML = `សូមស្វាគមន៍អ្នកនាង <strong>Sivleng (Editor)</strong> មកកាន់ប្រព័ន្ធគ្រប់គ្រងមាតិកា!`;
      }

      showToast(`ផ្លាស់ប្តូរគណនីទៅជា "${name} (${role})"`);
      renderCards();
    }

    let psisTopicsData = [];
    let commentsData = {};

    function loadData() {
      const savedUser = localStorage.getItem('psis_current_user');
      if (savedUser) {
        try { currentUser = JSON.parse(savedUser); } catch(e) {}
      }

      const saved = localStorage.getItem('psis_topics_data_v22');
      if (saved) {
        try { psisTopicsData = JSON.parse(saved); } catch (e) { psisTopicsData = buildMasterDatasetFromUserTitles(); }
      } else {
        psisTopicsData = buildMasterDatasetFromUserTitles();
      }

      // BULLETPROOF SAFEGUARD: If empty or invalid on fresh GitHub Pages deploy, force populate master dataset!
      if (!psisTopicsData || !Array.isArray(psisTopicsData) || psisTopicsData.length === 0) {
        psisTopicsData = buildMasterDatasetFromUserTitles();
        saveData();
      }

      const savedComments = localStorage.getItem('psis_comments_data_v22');
      if (savedComments) {
        try { commentsData = JSON.parse(savedComments); } catch (e) { commentsData = {}; }
      }
    }

    function saveData() {
      localStorage.setItem('psis_topics_data_v22', JSON.stringify(psisTopicsData));
      localStorage.setItem('psis_comments_data_v22', JSON.stringify(commentsData));
    }

    let selectedCards = new Set();

    function handleSearch() {
      displayLimit = 20;
      renderCards();
    }

    function setStatusFilter(status, pillBtn) {
      currentStatusFilter = status;
      displayLimit = 20;
      document.querySelectorAll('.status-pill').forEach(pill => pill.classList.remove('active'));
      if (pillBtn) pillBtn.classList.add('active');
      renderCards();
    }

    function filterUnapproved() {
      setStatusFilter('UNAPPROVED', document.querySelector('.status-pill.pill-warning'));
      showToast('បានចម្រោះបង្ហាញតែមាតិកាដែលមិនទាន់ Approve!');
    }

    function loadMoreCards() {
      displayLimit += 20;
      renderCards();
    }

    function renderCards() {
      loadData();
      const container = document.getElementById('cardsGrid');
      const query = document.getElementById('searchInput').value.toLowerCase();
      
      let allFiltered = psisTopicsData.filter(item => {
        const workflow = item.workflowStatus || 'Draft';
        const isEditedBySivleng = (item.lastEditedBy === 'Sivleng' || item.editedBySivleng === true);

        let matchesStatus = true;
        if (currentStatusFilter === 'UNAPPROVED') {
          matchesStatus = (workflow === 'Draft' || workflow === 'Review');
        } else if (currentStatusFilter === 'Edited') {
          matchesStatus = isEditedBySivleng;
        } else if (currentStatusFilter !== 'ALL') {
          matchesStatus = (workflow === currentStatusFilter);
        }

        const matchesCategory = (currentFilter === 'ALL' || item.category === currentFilter);
        const matchesQuery = item.title.toLowerCase().includes(query) || 
                             item.objective.toLowerCase().includes(query) ||
                             item.day.toLowerCase().includes(query) ||
                             workflow.toLowerCase().includes(query);
        return matchesStatus && matchesCategory && matchesQuery;
      });

      updateStats();

      if (allFiltered.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #ffffff; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
            <i class="fa-solid fa-folder-open" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 14px;"></i>
            <h3 style="font-size: 1.2rem; color: var(--navy-blue); margin-bottom: 6px;">មិនមាន Card ក្នុងលក្ខខណ្ឌចម្រោះនេះទេ</h3>
            <p style="font-size: 0.9rem; color: var(--text-muted);">សូមជ្រើសរើសប្រភេទចម្រោះផ្សេង ឬចុច "ទាំងអស់" ដើម្បីមើលមាតិកាទាំងអស់វិញ។</p>
          </div>
        `;
        document.getElementById('loadMoreContainer').style.display = 'none';
        return;
      }

      // Fast Performance Slice
      const visibleData = allFiltered.slice(0, displayLimit);
      const remaining = allFiltered.length - visibleData.length;

      container.innerHTML = visibleData.map(card => {
        const isSelected = selectedCards.has(card.id);
        const workflow = card.workflowStatus || 'Draft';
        const cardComments = commentsData[card.id] || [];
        const isApproved = (workflow === 'Approved');
        const isPosted = (workflow === 'Posted');
        const isPendingReview = (workflow === 'Review');
        const isSivlengEdited = (card.lastEditedBy === 'Sivleng' || card.editedBySivleng === true);

        return `
          <article class="card-container ${isSelected ? 'selected' : ''} ${isPendingReview ? 'is-pending-review' : ''} ${isApproved ? 'is-approved' : ''} ${isPosted ? 'is-posted' : ''}" data-category="${card.category}" id="${card.id}">
            <div class="card-content">
              <div class="badge-bar">
                <div class="badge-left">
                  <input type="checkbox" class="select-checkbox" ${isSelected ? 'checked' : ''} onchange="toggleSelectCard('${card.id}')">
                  <div class="badge-wrapper">
                    <span class="badge-gray">${card.day}</span>
                    <span class="badge-red">${card.category}</span>
                    ${card.hasPdfGuide ? '<span class="badge-pdf"><i class="fa-solid fa-file-pdf"></i> PDF Guide</span>' : ''}
                    ${isSivlengEdited ? '<span class="badge-edited" title="Sivleng បានកែសម្រួល Card នេះ"><i class="fa-solid fa-pen-to-square"></i> Sivleng បានកែ</span>' : ''}
                  </div>
                </div>
                
                <div class="card-actions-top">
                  <select class="workflow-select status-${workflow.toLowerCase().replace(' ', '')}" onchange="updateWorkflowStatus('${card.id}', this.value)" ${currentUser.role === 'Editor' && (workflow === 'Approved' || workflow === 'Posted') ? 'disabled title="អនុម័តរួចដោយ Chhit (Admin)"' : ''}>
                    <option value="Draft" ${workflow === 'Draft' ? 'selected' : ''}>📝 Draft</option>
                    <option value="Review" ${workflow === 'Review' ? 'selected' : ''}>🔍 Review (ពិនិត្យ)</option>
                    <option value="Approved" ${workflow === 'Approved' ? 'selected' : ''}>✅ Approved ${currentUser.role === 'Editor' ? '(by Chhit)' : ''}</option>
                    <option value="Posted" ${workflow === 'Posted' ? 'selected' : ''}>🚀 Posted ${currentUser.role === 'Editor' ? '(by Chhit)' : ''}</option>
                  </select>

                  <button class="btn-card-action btn-tg-notify" onclick="openSingleTelegramModal('${card.id}')" title="Send to DG And DDG"><i class="fa-paper-plane fa-solid"></i> Notify</button>
                  <button class="btn-card-action btn-pdf-dl" onclick="downloadCardPDF('${card.id}')" title="Export PDF Brochure"><i class="fa-solid fa-file-pdf"></i> PDF</button>
                  <button class="btn-card-action btn-dl" onclick="downloadCardImage('${card.id}')" title="Download PNG"><i class="fa-solid fa-download"></i> PNG</button>
                  <button class="btn-card-action" onclick="openEditModal('${card.id}')" title="Edit"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                </div>
              </div>

              <h2 class="card-main-title">${card.title}</h2>

              <div class="objective-box">
                <div class="objective-title"><i class="fa-solid fa-bullseye"></i> គោលបំណង</div>
                <div class="objective-text">${card.objective}</div>
              </div>

              <div class="grid-2col">
                <div>
                  <div class="col-header">
                    <span><i class="fa-solid fa-microphone"></i> SCRIPT</span>
                    <button class="btn-copy" onclick="copyText(this, 'script-${card.id}')"><i class="fa-regular fa-copy"></i> Copy</button>
                  </div>
                  <div id="script-${card.id}">
                    <p class="script-paragraph"><strong>[Hook]:</strong> ${card.script.hook}</p>
                    <p class="script-paragraph"><strong>[បរិបទ]:</strong> ${card.script.context}</p>
                    <p class="script-paragraph"><strong>[សកម្មភាព]:</strong> ${card.script.action}</p>
                    <p class="script-paragraph"><strong>[លទ្ធផល]:</strong> ${card.script.result}</p>
                    <p class="script-paragraph"><strong>[CTA]:</strong> ${card.script.cta}</p>
                  </div>
                </div>

                <div>
                  <div class="col-header"><span><i class="fa-solid fa-video"></i> SHOT LIST</span></div>
                  <div class="shot-list-item"><strong>Opening:</strong> ${card.shotList.opening}</div>
                  <div class="shot-list-item"><strong>B-roll 1:</strong> ${card.shotList.broll1}</div>
                  <div class="shot-list-item"><strong>B-roll 2:</strong> ${card.shotList.broll2}</div>
                  <div class="shot-list-item"><strong>Graphic:</strong> ${card.shotList.graphic}</div>
                  <div class="shot-list-item"><strong>Ending:</strong> ${card.shotList.ending}</div>
                </div>
              </div>

              <div class="caption-box">
                <div class="caption-header-row">
                  <div class="caption-header"><i class="fa-solid fa-align-left"></i> CAPTION / CTA</div>
                  <button class="btn-copy" onclick="copyText(this, 'caption-${card.id}')"><i class="fa-regular fa-copy"></i> Copy Caption</button>
                </div>
                <div class="caption-text" id="caption-${card.id}">${card.caption}</div>
              </div>

              <!-- Internal Comments Section -->
              <div class="comments-section">
                <div class="comments-title"><i class="fa-regular fa-comments"></i> ទំនាក់ទំនង & ចំណាំប្រចាំ Card (Team Comments)</div>
                <div class="comment-list">
                  ${cardComments.length > 0 ? cardComments.map(c => `
                    <div class="comment-item">
                      <span class="comment-author">${c.author}:</span>
                      <span>${c.text}</span>
                      <span class="comment-time">${c.time}</span>
                    </div>
                  `).join('') : '<div style="font-size: 0.78rem; color: #94a3b8;">មិនទាន់មានចំណាំ ឬ Comment ឡើយ...</div>'}
                </div>
                <div class="comment-input-row">
                  <input type="text" id="comment-input-${card.id}" class="comment-input" placeholder="សរសេរ Comment ក្នុងនាម ${currentUser.name} (${currentUser.role})..." onkeypress="handleCommentKeyPress(event, '${card.id}')">
                  <button class="btn-send-comment" onclick="addComment('${card.id}')">ផ្ញើ</button>
                </div>
              </div>
            </div>

            <div class="card-bottom-banner">
              <div class="banner-top-row">
                <span class="banner-label">ព័ត៌មានទូទៅសម្រាប់ CONTENT</span>
                <span class="banner-cta-badge">ចុះឈ្មោះថ្ងៃនេះ!</span>
              </div>
              <div class="campus-tags">សាខា TK • TTP • CAP • RSK • NR3</div>
              <div class="offer-title">អាហារូបករណ៍ពិសេស $300</div>
              <div class="banner-footer-note">ចុះឈ្មោះក្នុងខែសីហា 2026 • ទំព័រ Facebook ឬអញ្ជើញមកកាន់ទីតាំងសាលាដោយផ្ទាល់</div>
            </div>
          </article>
        `;
      }).join('');

      // Load More Button visibility
      const loadMoreContainer = document.getElementById('loadMoreContainer');
      const remainingCount = document.getElementById('remainingCount');
      if (remaining > 0) {
        loadMoreContainer.style.display = 'block';
        remainingCount.innerText = remaining;
      } else {
        loadMoreContainer.style.display = 'none';
      }

      updateSelectionBar();
    }

    function updateWorkflowStatus(cardId, newStatus) {
      const card = psisTopicsData.find(c => c.id === cardId);
      if (card) {
        card.workflowStatus = newStatus;
        if (currentUser.name === 'Sivleng') {
          card.lastEditedBy = 'Sivleng';
          card.editedBySivleng = true;
        }
        saveData();
        showToast(`ប្តូរស្ថានភាពទៅ "${newStatus}" ដោយ ${currentUser.name}`);
        renderCards();

        // NO AUTOMATIC TELEGRAM POPUP - Manual trigger via Notify button only!
      }
    }

    function downloadCardPDF(cardId) {
      const element = document.getElementById(cardId);
      if (!element) return;

      showToast('កំពុងរៀបចំទាញយក PDF Document...');

      const actionsTop = element.querySelector('.card-actions-top');
      const checkbox = element.querySelector('.select-checkbox');
      const commentInput = element.querySelector('.comment-input-row');
      if (actionsTop) actionsTop.style.visibility = 'hidden';
      if (checkbox) checkbox.style.visibility = 'hidden';
      if (commentInput) commentInput.style.display = 'none';

      const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `psis_${cardId}_content_brochure.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        if (actionsTop) actionsTop.style.visibility = 'visible';
        if (checkbox) checkbox.style.visibility = 'visible';
        if (commentInput) commentInput.style.display = 'flex';
        showToast('បាន Download ឯកសារ PDF ដោយជោគជ័យ!');
      });
    }

    async function downloadSelectedPDFs() {
      if (selectedCards.size === 0) return;
      showToast(`កំពុង Download ឯកសារ PDF ទាំង ${selectedCards.size} Cards...`);
      for (const cardId of selectedCards) {
        await new Promise(resolve => {
          downloadCardPDF(cardId);
          setTimeout(resolve, 800);
        });
      }
    }

    function openSingleTelegramModal(cardId) {
      const card = psisTopicsData.find(c => c.id === cardId);
      if (!card) return;

      activeTgCard = card;
      const statusIcon = card.workflowStatus === 'Approved' ? '✅ Approved (អនុម័តរួច)' : (card.workflowStatus === 'Review' ? '🔍 Review (រង់ចាំការពិនិត្យ)' : '📝 Draft');

      const msg = `Dear DG And DDG,\n\n` +
                  `📢 [PSIS CONTENT APPROVAL REPORT]\n` +
                  `----------------------------------------\n` +
                  `📌 [${card.day}] ${card.title}\n` +
                  `🏷️ ប្រភេទ: ${card.category}\n` +
                  `🚦 ស្ថានភាព: ${statusIcon}\n` +
                  `👤 ផ្ញើដោយ: ${currentUser.name} (${currentUser.role})\n\n` +
                  `🎯 គោលបំណង:\n${card.objective}\n\n` +
                  `🎙️ VOICE-OVER SCRIPT:\n` +
                  `- Hook: ${card.script.hook}\n` +
                  `- បរិបទ: ${card.script.context}\n` +
                  `- សកម្មភាព: ${card.script.action}\n` +
                  `- លទ្ធផល: ${card.script.result}\n` +
                  `- CTA: ${card.script.cta}\n\n` +
                  `💬 សូមគោរពជម្រាបជូន ពិនិត្យ និងអនុម័តមាតិកានេះ! 🙏`;

      document.getElementById('tgMsgPreviewText').innerText = msg;
      document.getElementById('telegramManagerModal').classList.add('open');
    }

    function openBatchTelegramModal() {
      const reviewCards = psisTopicsData.filter(c => c.workflowStatus === 'Review' || c.workflowStatus === 'Draft');
      if (reviewCards.length === 0) {
        showToast('មិនមាន Card ក្នុងលក្ខខណ្ឌ Review/Draft ឡើយ!');
        return;
      }

      const summaryList = reviewCards.slice(0, 10).map(c => `• [${c.day}] ${c.title} (${c.workflowStatus})`).join('\n');
      const msg = `Dear DG And DDG,\n\n` +
                  `📢 [PSIS SUMMARY CONTENT REPORT]\n` +
                  `----------------------------------------\n` +
                  `សូមគោរពជូនរបាយការណ៍មាតិកាមិនទាន់ Approve (${reviewCards.length} Cards):\n\n` +
                  `${summaryList}\n... និងមាតិកាផ្សេងទៀតសរុប ${reviewCards.length} Cards\n\n` +
                  `👤 ផ្ញើជូនដោយ: ${currentUser.name}\n` +
                  `💬 សូមគោរពជម្រាបជូន ពិនិត្យ និងអនុម័តមាតិកានេះ! 🙏`;

      document.getElementById('tgMsgPreviewText').innerText = msg;
      document.getElementById('telegramManagerModal').classList.add('open');
    }

    function closeTelegramManagerModal() {
      document.getElementById('telegramManagerModal').classList.remove('open');
    }

    function executeSendTelegramNotification() {
      const textToCopy = document.getElementById('tgMsgPreviewText').innerText;
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('បានចម្លងអត្ថបទ និងបើក Telegram Chat ជូន DG And DDG!');
        window.location.href = `tg://openmessage?user_id=${telegramManagerChatId}`;
        closeTelegramManagerModal();
      });
    }

    function executeSendTelegramWeb() {
      const textToCopy = document.getElementById('tgMsgPreviewText').innerText;
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('បានចម្លងអត្ថបទ និងបើក Telegram Web ជូន DG And DDG!');
        window.open(`https://web.telegram.org/`, '_blank');
        closeTelegramManagerModal();
      });
    }

    function addComment(cardId) {
      const input = document.getElementById(`comment-input-${cardId}`);
      if (!input || !input.value.trim()) return;

      if (!commentsData[cardId]) commentsData[cardId] = [];

      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      commentsData[cardId].push({
        author: `${currentUser.name} (${currentUser.role})`,
        text: input.value.trim(),
        time: timeNow
      });

      const card = psisTopicsData.find(c => c.id === cardId);
      if (card && currentUser.name === 'Sivleng') {
        card.lastEditedBy = 'Sivleng';
        card.editedBySivleng = true;
      }

      saveData();
      showToast(`បានបន្ថែម Comment ក្នុងនាម ${currentUser.name}!`);
      renderCards();
    }

    function handleCommentKeyPress(e, cardId) {
      if (e.key === 'Enter') addComment(cardId);
    }

    function downloadCardImage(cardId) {
      const element = document.getElementById(cardId);
      if (!element) return;

      showToast('កំពុងរៀបចំទាញយករូបភាព Card...');

      const actionsTop = element.querySelector('.card-actions-top');
      const checkbox = element.querySelector('.select-checkbox');
      const commentInput = element.querySelector('.comment-input-row');
      if (actionsTop) actionsTop.style.visibility = 'hidden';
      if (checkbox) checkbox.style.visibility = 'hidden';
      if (commentInput) commentInput.style.display = 'none';

      html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        if (actionsTop) actionsTop.style.visibility = 'visible';
        if (checkbox) checkbox.style.visibility = 'visible';
        if (commentInput) commentInput.style.display = 'flex';

        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `psis_${cardId}_content.png`;
        link.click();
        showToast('បាន Download រូបភាព Card (PNG) រក្សាទុក!');
      });
    }

    async function downloadSelectedCards() {
      if (selectedCards.size === 0) return;
      showToast(`កំពុង Download រូបភាព ${selectedCards.size} Cards...`);
      for (const cardId of selectedCards) {
        await new Promise(resolve => {
          downloadCardImage(cardId);
          setTimeout(resolve, 800);
        });
      }
    }

    function updateStats() {
      const draftCount = psisTopicsData.filter(c => (c.workflowStatus || 'Draft') === 'Draft').length;
      const editedCount = psisTopicsData.filter(c => c.lastEditedBy === 'Sivleng' || c.editedBySivleng === true).length;
      const reviewCount = psisTopicsData.filter(c => c.workflowStatus === 'Review').length;
      const approvedCount = psisTopicsData.filter(c => c.workflowStatus === 'Approved').length;
      const postedCount = psisTopicsData.filter(c => c.workflowStatus === 'Posted').length;
      const unapprovedTotal = draftCount + reviewCount;

      document.getElementById('statTotal').innerText = psisTopicsData.length;
      document.getElementById('statDraft').innerText = draftCount;
      document.getElementById('statEdited').innerText = editedCount;
      document.getElementById('statReview').innerText = reviewCount;
      document.getElementById('statApproved').innerText = approvedCount;
      document.getElementById('statPosted').innerText = postedCount;
      
      const unapprovedBadge = document.getElementById('unapprovedCount');
      if (unapprovedBadge) unapprovedBadge.innerText = unapprovedTotal;

      const statusUnapprovedBadge = document.getElementById('statusUnapprovedCount');
      if (statusUnapprovedBadge) statusUnapprovedBadge.innerText = unapprovedTotal;

      const statusEditedBadge = document.getElementById('statusEditedCount');
      if (statusEditedBadge) statusEditedBadge.innerText = editedCount;

      const statusReviewBadge = document.getElementById('statusReviewCount');
      if (statusReviewBadge) statusReviewBadge.innerText = reviewCount;
    }

    function toggleSelectCard(id) {
      if (selectedCards.has(id)) selectedCards.delete(id);
      else selectedCards.add(id);
      renderCards();
    }

    function updateSelectionBar() {
      const bar = document.getElementById('selectionBar');
      const countEl = document.getElementById('selectionCount');
      if (selectedCards.size > 0) {
        bar.classList.add('active');
        countEl.innerText = `បានជ្រើសរើស ${selectedCards.size} Cards (Selected)`;
      } else {
        bar.classList.remove('active');
      }
    }

    function clearSelection() { selectedCards.clear(); renderCards(); }

    function copySelectedCaptions() {
      if (selectedCards.size === 0) return;
      const selectedItems = psisTopicsData.filter(item => selectedCards.has(item.id));
      const combinedCaptions = selectedItems.map((item) => `=== [${item.day}] ${item.title} ===\n\n${item.caption}\n`).join('\n----------------------------------------\n\n');
      
      navigator.clipboard.writeText(combinedCaptions).then(() => {
        showToast(`បានចម្លង Caption ទាំង ${selectedCards.size} ដោយជោគជ័យ!`);
      });
    }

    function exportSelectedJSON() {
      const selectedItems = psisTopicsData.filter(item => selectedCards.has(item.id));
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedItems, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `psis_selected_content_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    function setFilter(category, pillBtn) {
      currentFilter = category;
      displayLimit = 20;
      document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.remove('active'));
      pillBtn.classList.add('active');
      renderCards();
    }

    function copyText(btnElement, targetId) {
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      const textToCopy = targetElement.innerText || targetElement.textContent;

      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btnElement.innerHTML;
        btnElement.classList.add('copied');
        btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        showToast('បានចម្លងអត្ថបទដោយជោគជ័យ!');

        setTimeout(() => {
          btnElement.innerHTML = originalText;
          btnElement.classList.remove('copied');
        }, 2000);
      });
    }

    function openEditModal(cardId) {
      const item = psisTopicsData.find(d => d.id === cardId);
      if (!item) return;

      document.getElementById('modalHeaderTitle').innerText = `កែសម្រួលមាតិកា (Edit Content Card) - ដោយ ${currentUser.name}`;
      document.getElementById('editCardId').value = item.id;
      document.getElementById('formDay').value = item.day;
      document.getElementById('formCategory').value = item.category;
      document.getElementById('formTitle').value = item.title;
      document.getElementById('formObjective').value = item.objective;
      
      document.getElementById('formHook').value = item.script.hook;
      document.getElementById('formContext').value = item.script.context;
      document.getElementById('formAction').value = item.script.action;
      document.getElementById('formResult').value = item.script.result;
      document.getElementById('formCta').value = item.script.cta;

      document.getElementById('formOpening').value = item.shotList.opening;
      document.getElementById('formBroll1').value = item.shotList.broll1;
      document.getElementById('formBroll2').value = item.shotList.broll2;
      document.getElementById('formGraphic').value = item.shotList.graphic;
      document.getElementById('formEnding').value = item.shotList.ending;

      document.getElementById('formCaption').value = item.caption;

      document.getElementById('editModal').classList.add('open');
    }

    function openAddModal() {
      document.getElementById('modalHeaderTitle').innerText = `បន្ថែម Card មាតិកាថ្មី (Add New Card) - ដោយ ${currentUser.name}`;
      document.getElementById('editCardId').value = `card-custom-${Date.now()}`;
      document.getElementById('editForm').reset();
      document.getElementById('formDay').value = `Card #${psisTopicsData.length + 1}`;
      document.getElementById('editModal').classList.add('open');
    }

    function closeEditModal() { document.getElementById('editModal').classList.remove('open'); }

    function handleFormSubmit(e) {
      e.preventDefault();
      const id = document.getElementById('editCardId').value;
      const index = psisTopicsData.findIndex(d => d.id === id);

      const updatedCard = {
        id: id,
        day: document.getElementById('formDay').value,
        category: document.getElementById('formCategory').value,
        title: document.getElementById('formTitle').value,
        objective: document.getElementById('formObjective').value,
        workflowStatus: index !== -1 ? (psisTopicsData[index].workflowStatus || 'Draft') : 'Draft',
        lastEditedBy: currentUser.name,
        editedBySivleng: currentUser.name === 'Sivleng' ? true : (index !== -1 ? psisTopicsData[index].editedBySivleng : false),
        script: {
          hook: document.getElementById('formHook').value,
          context: document.getElementById('formContext').value,
          action: document.getElementById('formAction').value,
          result: document.getElementById('formResult').value,
          cta: document.getElementById('formCta').value
        },
        shotList: {
          opening: document.getElementById('formOpening').value,
          broll1: document.getElementById('formBroll1').value,
          broll2: document.getElementById('formBroll2').value,
          graphic: document.getElementById('formGraphic').value,
          ending: document.getElementById('formEnding').value
        },
        caption: document.getElementById('formCaption').value
      };

      if (index !== -1) psisTopicsData[index] = updatedCard;
      else psisTopicsData.unshift(updatedCard);

      saveData();
      closeEditModal();
      renderCards();
      showToast(`រក្សាទុក Card ដោយ ${currentUser.name}!`);
    }

    function showToast(message) {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> ${message}`;
      container.appendChild(toast);

      setTimeout(() => toast.classList.add('show'), 50);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 2500);
    }

    window.addEventListener('DOMContentLoaded', () => { 
      loadData();
      switchUser(currentUser.name, currentUser.role);
    });
  