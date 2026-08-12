var REF = undefined
function setupRef() {
  const refData = window.sessionStorage.getItem('REF')
  if (refData) {
    REF = JSON.parse(atob(decodeURIComponent(refData)))
  }
}
setupRef()

function getFERData(data, unit) {
  if (REF && REF.Mode === 'quiz') {
    const ferData = btoa(
      encodeURIComponent(
        JSON.stringify({
          type: 'PK',
          unit: unit || '',
          level: 'PK',
          referer: REF.referer,
          data: data,
        }),
      ),
    )
    return ferData
  }
  return undefined
}

function studyFinish(ferData) {
  window.sessionStorage.removeItem('REF')
  window.sessionStorage.removeItem('apiStudyInfo')

  if (ferData) {
    window.sessionStorage.setItem('FER', ferData)
    window.location.replace('/rg-study-result/study-result.html')
  } else {
    window.location.replace(REF?.referer || '/')
  }
}

function onFinishStudyResult(code, data, unit) {
  const ferData = getFERData(data, unit)
  studyFinish(ferData)
}

function onExitStudy() {
  window.location.replace(REF?.referer || '/')
}

function onLogoutStudy() {
  window.location.replace(REF?.logoutUrl || '/signoff')
}

// --- 온라인/오프라인 이벤트 등록 ---
window.addEventListener('online', () => {
  console.log('[study] 인터넷 연결됨: checkSession 시작')
})

window.addEventListener('offline', () => {
  console.log('[study] 인터넷 끊김: checkSession 중지')
})

// --- 최초 실행 ---
if (navigator.onLine) {
}
