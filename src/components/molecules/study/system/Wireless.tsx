import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { IconWireless } from '@components/atoms/common/icons/IconWireless'
import { useNetworkStatus } from '@contexts/NetworkStatusContext'

export default function Wirelelss() {
  const { isOnline } = useNetworkStatus()
  const { t } = useTranslation()

  return (
    <>
      {
        <BgWireless
          style={{
            display: isOnline ? 'none' : 'flex',
          }}
        >
          <WrapperWireless>
            <IconWireless />
            <p style={{ color: 'white' }}>
              {t(`common.networkError`)}
            </p>
          </WrapperWireless>
        </BgWireless>
      }
    </>
  )
}

const BgWireless = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
`

const WrapperWireless = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  background: rgba(17, 24, 39, 0.9);
`
