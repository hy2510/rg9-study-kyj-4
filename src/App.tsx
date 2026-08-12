import { Suspense } from 'react'

import AppContextProvider from '@contexts/AppContext'
import { MultiTabBlockContextProvider } from '@contexts/MultiTabBlockContext'
import { NetworkStatusProvider } from '@contexts/NetworkStatusContext'
import InfoContainer from '@pages/InfoContainer'

export default function App() {
  return (
    <AppContextProvider>
      <Suspense fallback={<div></div>}>
        <NetworkStatusProvider>
          <MultiTabBlockContextProvider>
            <InfoContainer />
          </MultiTabBlockContextProvider>
        </NetworkStatusProvider>
      </Suspense>
    </AppContextProvider>
  )
}
