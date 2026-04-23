const initialState = {
  selectedReportTab: "weekly", // 添加默认值
  // ... 其他状态
};

function renderCategoryBreakdown(category) {
  const safeCategory = escapeHtml(category); // 防止 XSS
  // ... 其他渲染逻辑
}

function renderRecords(records) {
  if (!refs.template || !templateSelector) { // 增加防御性检查
    console.error('缺少模板或选择器');
    return;
  }
  // 改进事件绑定代码
  // ... 其他渲染逻辑
}