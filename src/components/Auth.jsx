import { useState } from 'react'
import SignIn from './SignIn'
import SignUp from './SignUp'

export default function Auth() {
  const [view, setView] = useState('signin') // 'signin' or 'signup'

  return view === 'signin' ? (
    <SignIn onSignUpClick={() => setView('signup')} />
  ) : (
    <SignUp onSignInClick={() => setView('signin')} />
  )
}