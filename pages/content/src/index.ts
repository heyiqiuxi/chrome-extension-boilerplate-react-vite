import { toggleTheme } from '@src/toggleTheme';

console.log('content script loaded');

void toggleTheme();

let normalText = '';
let platformText = '';

const tabContainer = document.createElement('div');
tabContainer.className = 'tab-container';

const normalTab = document.createElement('button');
normalTab.innerText = '普通';
normalTab.className = 'tab-button active';

const platformTab = document.createElement('button');
platformTab.innerText = '平台';
platformTab.className = 'tab-button';

// Add tab switching events
normalTab.onclick = () => {
  normalTab.className = 'tab-button active';
  platformTab.className = 'tab-button';
  getDomElement();
};

platformTab.onclick = () => {
  platformTab.className = 'tab-button active';
  normalTab.className = 'tab-button';
  getPlatformDomElement();
};

// Assemble elements
tabContainer.appendChild(normalTab);
tabContainer.appendChild(platformTab);
document.body.appendChild(tabContainer);

// Update styles to position tabs at the bottom right
const style = document.createElement('style');
style.textContent = `
  .tab-container {
    position: fixed;
    bottom: 0px;
    right: 0px;
    z-index: 9999;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 3px;
    padding: 5px;
    z-index: 9999;
    cursor: move;
    user-select: none;
    display: flex;
    flex-direction: row;
    gap: 5px;
  }

  .tab-button {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 2px 5px;
    font-size: 12px;
  }

  .active {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;
document.head.appendChild(style);

// 获取数据
const getData = async () => {
  const result = await chrome.storage.local.get(['normalText', 'platformText']);
  console.log(result, 'content');

  normalText = result.normalText || '';
  platformText = result.platformText || '';
  console.log(normalText, platformText, 'conte111nt');
};
getData();
chrome.runtime.onMessage.addListener(request => {
  if (request.type === 'setData') {
    getData();
  }
});

// 普通脚本
//1. 获取head
const getDomElement = async () => {
  const element = await retryGetElement(
    () => document.querySelector('.el-tabs__nav-scroll #tab-QUALITY_OF_SERVICE') as HTMLElement,
    'Quality of service tab not found',
    10,
  );
  if (!element) return;
  element.click();

  // 2. 获取dialog内容
  const dialogContentElement = await retryGetElement(
    () => document.querySelector('.dialog-content'),
    'Dialog content element not found',
    10,
  );
  if (!dialogContentElement) return;

  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. 获取普通工单处理按钮
  const normalOrderProcessingElement = await retryGetElement(
    () =>
      Array.from(dialogContentElement.querySelectorAll('span')).find(
        el => el.textContent?.includes('普通工单处理') && el.closest('.dialog-content') === dialogContentElement,
      ) as HTMLElement,
    'Normal order processing button not found',
  );
  if (!normalOrderProcessingElement) return;
  normalOrderProcessingElement.click();

  // 4. 添加延迟，等待页面响应
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 5. 获取固定右按钮
  const fixedRightButtonElement = await retryGetElement(
    () => document.querySelector('.fixed-right-button') as HTMLElement,
    'Fixed right button not found',
    10,
  );
  if (!fixedRightButtonElement) return;
  fixedRightButtonElement.click();
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 7. 检查确认申领文本是否存在
  const claimDialog = await retryGetElement(
    () => document.querySelector('[aria-label="工单申领"]'),
    'Claim dialog not found',
    10,
  );
  if (!claimDialog) return;
  await new Promise(resolve => setTimeout(resolve, 3000));

  await retryGetElement(
    () => {
      const divs = claimDialog.querySelectorAll('div');
      return Array.from(divs).some(div => {
        const text = div.textContent || '';
        return text.toLowerCase().indexOf('确认申领'.toLowerCase()) > -1;
      })
        ? true
        : null;
    },
    'Confirm claim text not found',
    10,
  );
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 8. 获取工单申领按钮
  const primaryButtonElement = await retryGetElement(
    () => document.querySelector('[aria-label="工单申领"] .el-button--primary') as HTMLElement,
    'Claim button not found',
  );
  if (!primaryButtonElement) return;
  primaryButtonElement.click();
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 9. 获取工单列表和处理按钮
  const processButton = await retryGetElement(
    () => {
      const rows = document.querySelectorAll('.el-table__body-wrapper table tbody .el-table__row');
      if (!rows || rows.length === 0) return null;
      return rows[0].querySelector('button[title="处理"]') as HTMLElement;
    },
    'Process button not found',
    10,
  );
  if (!processButton) return;
  processButton.click();
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 12. 获取textarea
  const textareaElement = await retryGetElement(
    () => document.querySelector('.form-item textarea[placeholder="请输入"]') as HTMLTextAreaElement,
    'Textarea element not found',
  );
  if (!textareaElement) return;

  // 13. 输入textarea
  textareaElement.value = normalText;
  textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
};

// 添加重试函数
const retryGetElement = async <T>(
  getter: () => T | null | undefined,
  errorMessage: string,
  maxAttempts = 10,
  interval = 3000,
): Promise<T | null> => {
  for (let i = 0; i < maxAttempts; i++) {
    const element = getter();
    if (element) {
      return element;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  console.log(`${errorMessage} (after ${maxAttempts} attempts)`);
  return null;
};

// 平台脚本
const getPlatformDomElement = async () => {
  // 1. 获取head
  const element = await retryGetElement(
    () => document.querySelector('.el-tabs__nav-scroll #tab-QUALITY_OF_SERVICE') as HTMLElement,
    'Quality of service tab not found',
    10,
  );
  if (!element) return;
  element.click();
  // 2. 获取dialog内容
  const dialogContentElement = await retryGetElement(
    () => document.querySelector('.dialog-content'),
    'Dialog content element not found',
    10,
  );
  if (!dialogContentElement) return;
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. 获取平台工单处理按钮
  const platformOrderButton = await retryGetElement(
    () =>
      Array.from(dialogContentElement.querySelectorAll('span')).find(
        el => el.textContent?.includes('平台工单处理 ') && el.closest('.dialog-content') === dialogContentElement,
      ) as HTMLElement,
    'Platform order button not found',
  );
  if (!platformOrderButton) return;
  platformOrderButton.click();

  // 4. 添加延迟，等待页面响应
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 5. 获取固定右按钮
  const fixedRightButton = await retryGetElement(
    () => document.querySelector('.fixed-right-button') as HTMLElement,
    'Fixed right button not found',
    10,
  );
  if (!fixedRightButton) return;
  fixedRightButton.click();
  await new Promise(resolve => setTimeout(resolve, 3000));
  // 7. 检查确认申领文本是否存在
  const claimDialog = await retryGetElement(
    () => document.querySelector('[aria-label="工单申领"]'),
    'Claim dialog not found',
    10,
  );
  if (!claimDialog) return;

  await new Promise(resolve => setTimeout(resolve, 3000));

  await retryGetElement(
    () => {
      const divs = claimDialog.querySelectorAll('div');
      return Array.from(divs).some(div => {
        const text = div.textContent || '';
        return text.toLowerCase().indexOf('确认申领'.toLowerCase()) > -1;
      })
        ? true
        : null;
    },
    'Confirm claim text not found',
    10,
  );
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 8. 获取工单申领按钮
  const primaryButtonElement = await retryGetElement(
    () => document.querySelector('[aria-label="工单申领"] .el-button--primary') as HTMLElement,
    'Claim button not found',
  );
  if (!primaryButtonElement) return;
  primaryButtonElement.click();
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 9. 获取工单列表和处理按钮
  const processButton = await retryGetElement(() => {
    const rows = document.querySelectorAll('.el-table__body-wrapper table tbody .el-table__row');
    if (!rows || rows.length === 0) return null;
    return rows[0].querySelector('button[title="处理"]') as HTMLElement;
  }, 'Process button not found');
  if (!processButton) return;
  processButton.click();
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 12. 获取textarea
  const textareaElement = await retryGetElement(
    () => document.querySelector('.form-item textarea[placeholder="请输入"]') as HTMLTextAreaElement,
    'Textarea element not found',
  );
  if (!textareaElement) return;
  console.log(platformText, 'platformText');
  // 13. 输入textarea
  textareaElement.value = platformText;
  textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
};
