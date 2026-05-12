import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { ModalProvider } from './contexts/ModalContext'
import AdminGuard from './AdminGuard'
import Layout from './components/Layout'
import { Loader2 } from 'lucide-react'

const PermGuard = ({ perm, children }) => {
  const { hasPermission } = useAuth()
  if (!hasPermission(perm)) return <Navigate to="/" replace />
  return children
}

const Login            = lazy(() => import('./pages/Login'))
const Dashboard        = lazy(() => import('./pages/Dashboard'))
const Deposits         = lazy(() => import('./pages/Deposits'))
const Withdrawals      = lazy(() => import('./pages/Withdrawals'))
const Members          = lazy(() => import('./pages/Members'))
const LotteryMarkets   = lazy(() => import('./pages/LotteryMarkets'))
const Results          = lazy(() => import('./pages/Results'))
const BetsList         = lazy(() => import('./pages/BetsList'))
const RestrictedNumbers = lazy(() => import('./pages/RestrictedNumbers'))
const WheelAdmin       = lazy(() => import('./pages/WheelAdmin'))
const Settings         = lazy(() => import('./pages/Settings'))
const Appearance       = lazy(() => import('./pages/Appearance'))
const Sliders          = lazy(() => import('./pages/Sliders'))
const Promotions       = lazy(() => import('./pages/Promotions'))
const Articles         = lazy(() => import('./pages/Articles'))
const Banks            = lazy(() => import('./pages/Banks'))
const Admins           = lazy(() => import('./pages/Admins'))
const DataManagement   = lazy(() => import('./pages/DataManagement'))
const MemberDetail     = lazy(() => import('./pages/MemberDetail'))
const TestConnection   = lazy(() => import('./pages/TestConnection'))

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="animate-spin text-primary" size={28} />
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AdminGuard><Layout /></AdminGuard>}>
              <Route index element={<Dashboard />} />
              <Route path="deposits"   element={<PermGuard perm="deposits">   <Deposits />        </PermGuard>} />
              <Route path="withdrawals" element={<PermGuard perm="withdrawals"><Withdrawals />     </PermGuard>} />
              <Route path="members"    element={<PermGuard perm="members">    <Members />         </PermGuard>} />
              <Route path="members/:id" element={<PermGuard perm="members">    <MemberDetail />    </PermGuard>} />
              <Route path="markets"    element={<PermGuard perm="markets">    <LotteryMarkets />  </PermGuard>} />
              <Route path="results"    element={<PermGuard perm="markets">    <Results />         </PermGuard>} />
              <Route path="bets"       element={<PermGuard perm="bets">       <BetsList />        </PermGuard>} />
              <Route path="restricted" element={<PermGuard perm="restricted"> <RestrictedNumbers /></PermGuard>} />
              <Route path="wheel"      element={<PermGuard perm="wheel">      <WheelAdmin />      </PermGuard>} />
              <Route path="settings"   element={<PermGuard perm="settings">   <Settings />        </PermGuard>} />
              <Route path="appearance" element={<PermGuard perm="appearance"> <Appearance />      </PermGuard>} />
              <Route path="sliders"    element={<PermGuard perm="sliders">    <Sliders />         </PermGuard>} />
              <Route path="promotions" element={<PermGuard perm="promotions"> <Promotions />      </PermGuard>} />
              <Route path="articles"   element={<PermGuard perm="articles">   <Articles />        </PermGuard>} />
              <Route path="banks"      element={<PermGuard perm="banks">      <Banks />           </PermGuard>} />
              <Route path="admins" element={<Admins />} />
              <Route path="data-management" element={<PermGuard perm="settings"><DataManagement /></PermGuard>} />
            </Route>
            <Route path="/test" element={<AdminGuard><TestConnection /></AdminGuard>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  )
}
