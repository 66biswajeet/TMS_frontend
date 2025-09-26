import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
  
  const tests = []
  
  // Test 1: Backend Health
  try {
    const response = await fetch(`${BACKEND_URL}/health`)
    tests.push({
      name: 'Backend Health',
      url: `${BACKEND_URL}/health`,
      status: response.ok ? 'PASS' : 'FAIL',
      data: response.ok ? await response.json() : null
    })
  } catch (error) {
    tests.push({
      name: 'Backend Health',
      url: `${BACKEND_URL}/health`,
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 2: Branches API
  try {
    const response = await fetch(`${BACKEND_URL}/branches`)
    const data = response.ok ? await response.json() : null
    tests.push({
      name: 'Branches API',
      url: `${BACKEND_URL}/branches`,
      status: response.ok ? 'PASS' : 'FAIL',
      branchCount: data?.items?.length || data?.length || 0,
      data: data
    })
  } catch (error) {
    tests.push({
      name: 'Branches API',
      url: `${BACKEND_URL}/branches`,
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 3: Management APIs
  try {
    const response = await fetch(`${BACKEND_URL}/management/org-hierarchy`)
    const data = response.ok ? await response.json() : null
    tests.push({
      name: 'Organization Hierarchy',
      url: `${BACKEND_URL}/management/org-hierarchy`,
      status: response.ok ? 'PASS' : 'FAIL',
      userCount: data?.items?.length || 0,
      data: data
    })
  } catch (error) {
    tests.push({
      name: 'Organization Hierarchy',
      url: `${BACKEND_URL}/management/org-hierarchy`,
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return NextResponse.json({
    backendUrl: BACKEND_URL,
    timestamp: new Date().toISOString(),
    tests,
    summary: {
      total: tests.length,
      passed: tests.filter(t => t.status === 'PASS').length,
      failed: tests.filter(t => t.status === 'FAIL').length
    }
  })
}