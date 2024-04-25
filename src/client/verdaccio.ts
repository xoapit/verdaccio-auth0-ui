import { getUsageInfo, init, isLoggedIn, copyToClipboard} from "./plugin"

const tabSelector = `[data-testid="tab-content"]`

function updateUsageInfo(): void {
  const loggedIn = isLoggedIn()
  if (!loggedIn) return

  const tabs = document.querySelectorAll(tabSelector)
  if (!tabs) return

  const usageInfoLines = getUsageInfo().split("\n")

  tabs.forEach((tab) => {
    const alreadyReplaced = tab.getAttribute("replaced") === "true"
    if (alreadyReplaced) return

    const commands = Array.from<HTMLElement>(tab.querySelectorAll("button"))
      .map((node) => node.parentElement!)
      .filter((node) => !!node.innerText.match(/^(npm|pnpm|yarn)/))
    if (!commands.length) return

    usageInfoLines.forEach((info) => {
      const cloned = commands[0].cloneNode(true) as HTMLElement
      const textEl = cloned.querySelector("span")!
      textEl.innerText = info

      const copyEl = cloned.querySelector("button")!
      copyEl.style.visibility = loggedIn ? "visible" : "hidden"
      copyEl.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        copyToClipboard(info)
      }

      commands[0].parentElement!.appendChild(cloned)
      tab.setAttribute("replaced", "true")
    })

    // Remove commands that don't work with oauth
    commands.forEach((node) => {
      if (
        node.innerText.includes("adduser") ||
        node.innerText.includes("set password")
      ) {
        node.parentElement!.removeChild(node)
        tab.setAttribute("replaced", "true")
      }
    })
  })
}

init({
  loginButton: `[data-testid="header--button-login"]`,
  logoutButton: `[data-testid="logOutDialogIcon"]`,
  updateUsageInfo,
})
