/* AI Assistant Widget for Portfolio Site */

/*
 * Capture the script element reference before the IIFE runs so that
 * document.currentScript is still available at the top level.
 * This is used to resolve the search index URL regardless of the
 * page's depth in the navigation hierarchy.
 */
var _aiScriptEl = document.currentScript;

(function () {
  'use strict';

  /* ---- System prompt preamble (role instructions only) ---- */
  var SYSTEM_PREAMBLE =
    'あなたはポートフォリオサイトのAIアシスタントです。\n' +
    'このサイトの所有者（バックエンドエンジニア）についての質問に答えてください。\n' +
    '丁寧かつ簡潔に日本語で答えてください。\n' +
    '関係のない話題については丁寧にお断りください。\n\n' +
    '以下にサイトのコンテンツを示します。これを参考に回答してください。\n\n';

  /* ---- Resolve the URL for search/search_index.json ---- */
  function getSearchIndexUrl() {
    /* Prefer the MkDocs Material __config JSON (always present). */
    var cfgEl = document.getElementById('__config');
    if (cfgEl) {
      try {
        var cfg = JSON.parse(cfgEl.textContent || cfgEl.innerText);
        if (typeof cfg.base === 'string') {
          return cfg.base + '/search/search_index.json';
        }
      } catch (e) { /* fall through */ }
    }
    /* Fallback: derive root from the script's absolute src URL.
       The script lives at [root]/overrides/js/ai_assistant.js. */
    var src = (_aiScriptEl && _aiScriptEl.src) || '';
    if (src) {
      var parts = src.split('/');
      parts.splice(-3);          /* remove overrides/js/ai_assistant.js */
      return parts.join('/') + '/search/search_index.json';
    }
    return 'search/search_index.json';
  }

  /* ---- Strip HTML tags to get plain text ---- */
  function stripHtml(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  }

  /* ---- Build system prompt from search index data ---- */
  function buildSystemPrompt(data) {
    var lines = [SYSTEM_PREAMBLE];
    var docs = data.docs || [];
    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i];
      /* Skip the print-site aggregation page to avoid duplication. */
      if (doc.location && doc.location.indexOf('print_page') !== -1) { continue; }
      if (doc.title) { lines.push('## ' + doc.title); }
      if (doc.text)  { lines.push(stripHtml(doc.text)); }
      lines.push('');
    }
    return lines.join('\n');
  }

  /* ---- Cache the resolved system prompt across calls ---- */
  var _systemPromptPromise = null;

  function loadSystemPrompt() {
    if (!_systemPromptPromise) {
      _systemPromptPromise = fetch(getSearchIndexUrl())
        .then(function (res) { return res.json(); })
        .then(function (data) { return buildSystemPrompt(data); })
        .catch(function () { return SYSTEM_PREAMBLE; });
    }
    return _systemPromptPromise;
  }

  var STORAGE_KEY = 'ai_assistant_config';

  function loadConfig() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { return JSON.parse(saved); }
    } catch (e) { /* ignore */ }
    return {
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: '',
      model: 'gpt-4o-mini'
    };
  }

  function saveConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) { /* ignore */ }
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function AIAssistant() {
    this.config = loadConfig();
    this.messages = [];
    this.isOpen = false;
    this.isSettingsOpen = false;
    this.isLoading = false;
    this._init();
  }

  AIAssistant.prototype._init = function () {
    var container = document.createElement('div');
    container.id = 'ai-assistant';
    container.setAttribute('aria-label', 'AIアシスタント');
    container.innerHTML = this._getHTML();
    document.body.appendChild(container);

    this.container = container;
    this.panel = container.querySelector('.ai-panel');
    this.messagesEl = container.querySelector('.ai-messages');
    this.inputEl = container.querySelector('.ai-input-text');
    this.sendBtn = container.querySelector('.ai-send-btn');
    this.settingsPanel = container.querySelector('.ai-settings-panel');

    this._attachEvents();
  };

  AIAssistant.prototype._getHTML = function () {
    return '<button class="ai-toggle-btn" aria-label="AIアシスタントを開く" title="AIアシスタント">' +
      '<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">' +
      '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z' +
      'm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>' +
      '</svg></button>' +

      '<div class="ai-panel" hidden role="dialog" aria-modal="true" aria-label="AIアシスタント">' +
        '<div class="ai-panel-header">' +
          '<span class="ai-panel-title">💬 AIアシスタント</span>' +
          '<div class="ai-header-actions">' +
            '<button class="ai-settings-btn" aria-label="設定を開く" title="設定">' +
              '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">' +
              '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.' +
              '12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04' +
              '-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96' +
              'c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.' +
              '07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 ' +
              '1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 ' +
              '1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.' +
              '6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>' +
              '</svg>' +
            '</button>' +
            '<button class="ai-close-btn" aria-label="閉じる" title="閉じる">✕</button>' +
          '</div>' +
        '</div>' +

        '<div class="ai-settings-panel" hidden>' +
          '<div class="ai-settings-body">' +
            '<p class="ai-settings-note">' +
              'OpenAI互換APIのエンドポイントとAPIキーを設定してください。' +
              '設定はブラウザのlocalStorageに保存されます。' +
            '</p>' +
            '<label class="ai-label">APIエンドポイント' +
              '<input type="url" class="ai-settings-endpoint" ' +
                'placeholder="https://api.openai.com/v1/chat/completions">' +
            '</label>' +
            '<label class="ai-label">APIキー' +
              '<input type="password" class="ai-settings-key" placeholder="sk-...">' +
            '</label>' +
            '<label class="ai-label">モデル' +
              '<input type="text" class="ai-settings-model" placeholder="gpt-4o-mini">' +
            '</label>' +
            '<button class="ai-settings-save">保存</button>' +
          '</div>' +
        '</div>' +

        '<div class="ai-messages" role="log" aria-live="polite" aria-label="会話"></div>' +

        '<div class="ai-input-area">' +
          '<textarea class="ai-input-text" placeholder="質問を入力してください..." ' +
            'rows="1" aria-label="メッセージ入力"></textarea>' +
          '<button class="ai-send-btn" aria-label="送信" title="送信（Enter）">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">' +
            '<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
      '</div>';
  };

  AIAssistant.prototype._attachEvents = function () {
    var self = this;
    var c = this.container;

    c.querySelector('.ai-toggle-btn').addEventListener('click', function () { self.toggle(); });
    c.querySelector('.ai-close-btn').addEventListener('click', function () { self.close(); });
    c.querySelector('.ai-settings-btn').addEventListener('click', function () { self.toggleSettings(); });
    c.querySelector('.ai-settings-save').addEventListener('click', function () { self.saveSettings(); });
    c.querySelector('.ai-send-btn').addEventListener('click', function () { self.send(); });

    this.inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        self.send();
      }
    });

    this.inputEl.addEventListener('input', function () {
      self.inputEl.style.height = 'auto';
      self.inputEl.style.height = Math.min(self.inputEl.scrollHeight, 120) + 'px';
    });
  };

  AIAssistant.prototype.toggle = function () {
    if (this.isOpen) { this.close(); } else { this.open(); }
  };

  AIAssistant.prototype.open = function () {
    this.isOpen = true;
    this.panel.removeAttribute('hidden');
    this.container.querySelector('.ai-toggle-btn').setAttribute('aria-label', 'AIアシスタントを閉じる');
    this.container.querySelector('.ai-toggle-btn').classList.add('active');

    if (this.messages.length === 0) {
      this._addBotMessage(
        'こんにちは！ポートフォリオについてご質問があればお気軽にどうぞ。\n\n' +
        '例：「得意な技術は何ですか？」「どんな案件に参加しましたか？」\n\n' +
        '⚙️ 設定ボタンからAPIキーを設定すると利用できます。'
      );
    }

    if (!this.config.apiKey) { this._showSettings(); }
    var self = this;
    setTimeout(function () { self.inputEl.focus(); }, 100);
  };

  AIAssistant.prototype.close = function () {
    this.isOpen = false;
    this.panel.setAttribute('hidden', '');
    this.container.querySelector('.ai-toggle-btn').setAttribute('aria-label', 'AIアシスタントを開く');
    this.container.querySelector('.ai-toggle-btn').classList.remove('active');
  };

  AIAssistant.prototype._showSettings = function () {
    this.isSettingsOpen = true;
    this.settingsPanel.removeAttribute('hidden');
    this.container.querySelector('.ai-settings-endpoint').value = this.config.apiEndpoint;
    this.container.querySelector('.ai-settings-key').value = this.config.apiKey;
    this.container.querySelector('.ai-settings-model').value = this.config.model;
  };

  AIAssistant.prototype._hideSettings = function () {
    this.isSettingsOpen = false;
    this.settingsPanel.setAttribute('hidden', '');
  };

  AIAssistant.prototype.toggleSettings = function () {
    if (this.isSettingsOpen) { this._hideSettings(); } else { this._showSettings(); }
  };

  AIAssistant.prototype.saveSettings = function () {
    var endpoint = this.container.querySelector('.ai-settings-endpoint').value.trim();
    var key = this.container.querySelector('.ai-settings-key').value.trim();
    var model = this.container.querySelector('.ai-settings-model').value.trim();

    this.config = {
      apiEndpoint: endpoint || 'https://api.openai.com/v1/chat/completions',
      apiKey: key,
      model: model || 'gpt-4o-mini'
    };
    saveConfig(this.config);
    this._hideSettings();
  };

  AIAssistant.prototype._renderMessage = function (role, content) {
    var div = document.createElement('div');
    div.className = 'ai-message ai-message-' + role;
    /* Render newlines as line breaks safely */
    var lines = content.split('\n');
    for (var i = 0; i < lines.length; i++) {
      if (i > 0) { div.appendChild(document.createElement('br')); }
      div.appendChild(document.createTextNode(lines[i]));
    }
    this.messagesEl.appendChild(div);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  };

  AIAssistant.prototype._addBotMessage = function (content) {
    this.messages.push({ role: 'assistant', content: content });
    this._renderMessage('assistant', content);
  };

  AIAssistant.prototype.send = function () {
    var text = this.inputEl.value.trim();
    if (!text || this.isLoading) { return; }

    if (!this.config.apiKey) {
      this._showSettings();
      return;
    }

    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';
    this.messages.push({ role: 'user', content: text });
    this._renderMessage('user', text);

    this.isLoading = true;
    this.sendBtn.disabled = true;

    var loadingEl = document.createElement('div');
    loadingEl.className = 'ai-message ai-message-assistant ai-message-loading';
    loadingEl.textContent = '…';
    this.messagesEl.appendChild(loadingEl);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

    var self = this;
    this._callAPI().then(function (reply) {
      loadingEl.remove();
      self._addBotMessage(reply);
    }).catch(function (err) {
      loadingEl.remove();
      self._addBotMessage('エラーが発生しました: ' + err.message);
    }).then(function () {
      self.isLoading = false;
      self.sendBtn.disabled = false;
      self.inputEl.focus();
    });
  };

  AIAssistant.prototype._callAPI = function () {
    var self = this;
    var userMessages = this.messages.slice(-20);

    return loadSystemPrompt().then(function (systemPrompt) {
      var messages = [{ role: 'system', content: systemPrompt }].concat(userMessages);

      var body = JSON.stringify({
        model: self.config.model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      });

      return fetch(self.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + self.config.apiKey
        },
        body: body
      }).then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            var msg = (data && data.error && data.error.message) || res.statusText;
            throw new Error(msg);
          });
        }
        return res.json();
      }).then(function (data) {
        var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        return content || '応答を取得できませんでした。';
      });
    });
  };

  function init() {
    if (document.getElementById('ai-assistant')) { return; }
    new AIAssistant();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
