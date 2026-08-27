export const comingSoonStage = {
  id: "coming-soon",
  title: "Màn tiếp theo",
  lede: "Màn này là chỗ gắn game mới. Thắng màn 1 sẽ mở khóa.",
  templateId: "tpl-coming-soon",
  mount(root, ctx) {
    ctx.setDebugInfo(() => ({ placeholder: true }));
    const backBtn = root.querySelector("[data-back]");
    backBtn.addEventListener("click", () => ctx.goTo("password"));
    return () => {};
  },
};
