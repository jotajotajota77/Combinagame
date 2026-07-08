// Gerencia o prompt nativo de instalação do PWA (evento beforeinstallprompt).
// O navegador só permite chamar `.prompt()` uma vez por evento capturado, então
// guardamos a referência aqui fora do React e o componente só liga/desliga a badge.
let deferredEvent = null

export function isStandaloneDisplay() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  )
}

// onChange(available: boolean) é chamado quando o prompt fica disponível/indisponível.
export function watchInstallPrompt(onChange) {
  const handleAvailable = (e) => {
    e.preventDefault()
    deferredEvent = e
    onChange(true)
  }
  const handleInstalled = () => {
    deferredEvent = null
    onChange(false)
  }
  window.addEventListener('beforeinstallprompt', handleAvailable)
  window.addEventListener('appinstalled', handleInstalled)
  return () => {
    window.removeEventListener('beforeinstallprompt', handleAvailable)
    window.removeEventListener('appinstalled', handleInstalled)
  }
}

// Dispara o prompt guardado. Devolve true se o usuário aceitou instalar.
export async function promptInstall() {
  if (!deferredEvent) return false
  deferredEvent.prompt()
  const { outcome } = await deferredEvent.userChoice
  deferredEvent = null
  return outcome === 'accepted'
}
