const URL_GITHUB = 'https://github.com/hangouthere/chrome-extension-autotoc';

const TemplatePanelContents = `
      <header>
        <span class="autotoc-title drag-handle">AutoToC</span>
        <div class="autotoc-controls">
          <span class="autotoc-collapse" title="Collapse All">⊟</span>
          <span class="autotoc-expand" title="Expand All">⊞</span>
          <span class="autotoc-separator">|</span>
          <span class="autotoc-refresh" title="Refresh">🔄</span>
          <span class="autotoc-options-cog" title="Options">⚙️</span>
          <span class="autotoc-close" title="Close">❌</span>
        </div>
      </header>
      
      <div class="headings-list"></div>

      <footer class="autotoc-list">
        <div class="autotoc-stats">
          <div class="autotoc-stats--search"></div>
          <div class="autotoc-stats--found"></div>
        </div>
        <input type="text" class="autotoc-search-input" placeholder="Search ToC...">
      </footer>

      <footer class="autotoc-footer">Built by CodexHere | <a href="${URL_GITHUB}" target="_blank">Github</a></footer>
`;

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.TemplatePanelContents = TemplatePanelContents;
