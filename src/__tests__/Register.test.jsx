import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Register from '../pages/Register'

// Mock the authApi module used by Register. component imports `register as apiRegister`.
vi.mock('../services/authApi', () => ({
  register: vi.fn()
}))

import { register as apiRegister } from '../services/authApi'

import { AuthContext } from '../context/AuthContext'

// Minimal mock AuthContext provider used by the component
const MockAuthProvider = ({ children }) => {
  const value = { isAuthenticated: false }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

describe('Register page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('shows field errors returned from API and handles success', async () => {
    // First, mock a validation error response
    apiRegister.mockResolvedValueOnce({
      ok: false,
      status: 400,
      body: { message: 'Invalid input', details: { email: 'Invalid email' } }
    })

    render(
      <MemoryRouter>
        <MockAuthProvider>
          <Register />
        </MockAuthProvider>
      </MemoryRouter>
    )

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/First Name/i), 'Test')
    await user.type(screen.getByLabelText(/Last Name/i), 'User')
    await user.type(screen.getByLabelText(/Email/i), 'invalid@example.com')
    await user.type(screen.getByLabelText(/^Password$/i), 'password123')
    await user.type(screen.getByLabelText(/Confirm Password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /Register/i }))

    // Expect the API to have been called
    expect(apiRegister).toHaveBeenCalled()

    // Field-level error should be displayed
    expect(await screen.findByText(/Invalid email/i)).toBeInTheDocument()

    // Also accept backend that returns `errors` instead of `details`
    apiRegister.mockResolvedValueOnce({ ok: false, status: 400, body: { message: 'Invalid input', errors: { email: 'Still invalid' } } })
    await user.click(screen.getByRole('button', { name: /Register/i }))
    expect(await screen.findByText(/Still invalid/i)).toBeInTheDocument()

    // Now mock a successful registration
    apiRegister.mockResolvedValueOnce({ ok: true, status: 201, body: { message: 'Registered' } })

    // Fix the email and submit again
    await user.clear(screen.getByLabelText(/Email/i))
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /Register/i }))

    expect(apiRegister).toHaveBeenCalledTimes(3)

    // Success message should appear
    expect(await screen.findByText(/Registration successful/i)).toBeInTheDocument()
  })

  it('client-side validates required first and last name and prevents API call', async () => {
    render(
      <MemoryRouter>
        <MockAuthProvider>
          <Register />
        </MockAuthProvider>
      </MemoryRouter>
    )

    const user = userEvent.setup()
    // leave first and last name empty
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^Password$/i), 'password123')
    await user.type(screen.getByLabelText(/Confirm Password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /Register/i }))

    // API should not be called due to client-side validation
    expect(apiRegister).not.toHaveBeenCalled()

    // field-level client errors should be visible
    expect(await screen.findByText(/First name is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/Last name is required/i)).toBeInTheDocument()
  })
})
