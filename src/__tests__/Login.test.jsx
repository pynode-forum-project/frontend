import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

vi.mock('../services/authApi', () => ({
  login: vi.fn()
}))

import { login as apiLogin } from '../services/authApi'
import { AuthContext } from '../context/AuthContext'

const renderWithAuth = (ui, { providerProps } = {}) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={providerProps}>{ui}</AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('Login page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('shows field errors from API and calls AuthContext.login on success', async () => {
    const authLogin = vi.fn()

    // First mock validation error from server
    apiLogin.mockResolvedValueOnce({ ok: false, status: 400, body: { message: 'Invalid', details: { email: 'Invalid email' } } })

    renderWithAuth(<Login />, { providerProps: { isAuthenticated: false, login: authLogin } })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Email/i), 'invalid@example.com')
    // use a valid-length password so client-side validation doesn't block the API call
    await user.type(screen.getByLabelText(/Password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /Login/i }))

    expect(apiLogin).toHaveBeenCalled()
    expect(await screen.findByText(/Invalid email/i)).toBeInTheDocument()

    // Next, mock successful login
    apiLogin.mockResolvedValueOnce({ ok: true, status: 200, body: { token: 'dev-token' } })

    // fix password to a valid length
    await user.clear(screen.getByLabelText(/Password/i))
    await user.type(screen.getByLabelText(/Password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /Login/i }))

    expect(apiLogin).toHaveBeenCalledTimes(2)
    expect(authLogin).toHaveBeenCalledWith('dev-token')
  })

  it('handles backend `error` string and `errors` object shapes', async () => {
    const authLogin = vi.fn()
    // backend returns error string
    apiLogin.mockResolvedValueOnce({ ok: false, status: 401, body: { error: 'Invalid credentials' } })

    renderWithAuth(<Login />, { providerProps: { isAuthenticated: false, login: authLogin } })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Email/i), 'bad@example.com')
    await user.type(screen.getByLabelText(/Password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /Login/i }))

    expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument()

    // backend returns `errors` object
    apiLogin.mockResolvedValueOnce({ ok: false, status: 400, body: { message: 'Invalid', errors: { password: 'Too short' } } })
    await user.click(screen.getByRole('button', { name: /Login/i }))
    expect(await screen.findByText(/Too short/i)).toBeInTheDocument()
  })
})
