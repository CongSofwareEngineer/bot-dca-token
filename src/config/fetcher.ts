
import { isEmpty } from 'lodash'



type IFetch = {
  url: string
  baseUrl?: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: any
  body?: any
  formData?: any
  auth?: string | boolean
  throwError?: boolean
  showError?: boolean
  fromBacoor?: boolean
  headers?: Record<string, any>
} & Omit<RequestInit, 'body' | 'headers'>

type ReturnData<T> = {
  statusCode: number
  data: T | null
  message: any
}



// import { showNotificationError } from '@/utils/Notification/index'

const apiUri = process.env.NEXT_PUBLIC_APP_URL || ''

export default async function fetcher<T = any>(options: IFetch): Promise<ReturnData<T> | null> {
  const {
    url,
    method = 'GET',
    query = undefined,
    body = undefined,
    throwError = false,
    fromBacoor = false,
    baseUrl = apiUri,
    headers = {},
    ...config
  } = options
  const callUrl: URL = url?.includes('http') ? new URL(url) : new URL(url, baseUrl)

  if (query) {
    Object.keys(query).forEach((key) => {
      const values = Array.isArray(query[key]) ? query[key] : [query[key]]

      values.forEach((v: any) => {
        if (callUrl.searchParams.has(key)) {
          callUrl.searchParams.append(key, v)
        } else {
          callUrl.searchParams.set(key, v)
        }
      })
    })
  }
  // if (url?.includes(DLN_URL) || baseUrl?.includes(DLN_URL)) {
  //   callUrl.searchParams.set('accesstoken', 'd6c45897b8f6')
  // }

  const headersConfig = new Headers({
    'content-type': 'application/json',
    accept: 'application/json',
    ...headers
  })

  if (fromBacoor) {
    headersConfig.set('from-bacoor-with-love', 'true')
  }


  const fetchInit: RequestInit = {
    headers: headersConfig,
    method,
    ...config
  }

  if (body) {
    fetchInit.body = JSON.stringify(body)
  }

  const resFetch = await fetch(callUrl.href, fetchInit)

  const resJson: any = await resFetch.json()


  if (!isEmpty(resJson)) {
    return {
      statusCode: 200,
      data: resJson?.data?.data || resJson?.data || resJson,
      message: 'success'
    }
  }

  // if (url?.includes(DLN_URL) || baseUrl?.includes(DLN_URL)) {
  //   return resJson ? { data: resJson, statusCode: 200, message: '' } : null
  // }

  console.log(resJson)
  // if (showError) {
  //   if (resJson?.message) {
  //     showNotificationError(resJson?.message)
  //   } else {
  //     showNotificationError('API Error')
  //   }
  // }

  if (throwError) {
    throw Error(resJson?.message)
  }

  return null
}


