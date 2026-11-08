const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const outDir = path.join(__dirname, '..', 'public', 'events')
fs.mkdirSync(outDir, { recursive: true })

const urls = [
  'https://sites.google.com/sitesv-images-rt/AMxu72v_8b0lERefIxBRV7fWkSUv-dsSLj5pyBd35xJs5Jg4CvrVgBOfPEHhS05ZX8qYxJcNfXSAjHRYEm81pX_Vkqw3CJEr1uRkj0OW1Ic5uSOmqhZA0_nz5e_LzNE9hnp0X1m9OasGI-euDtRbYurS0qPgAzcfrIDjX2FTRTA7IVmBZ7D8yeKH0hu5aaAjNiA=w1280',
  'https://sites.google.com/sitesv-images-rt/AMxu72spS9KHQu1wLdYRO6Uge-mNt0F74TQi4KuvXSKeGbz04i8jWfnBYSDuIT6BbAgiRnjbvTMUG9vnuzrVpNOmfHVvaFRbOYcux14ENPqgopSmUCquj9TKX0j9GtYKMfww47sHlptr1BWbc4YqkWyBEaE2kuLGOj3lW3THoZU8xDNFUD0Yo1gXIfqjaHkEFJc=w1280',
  'https://sites.google.com/sitesv-images-rt/AMxu72v-1otr8uYAoqAhktBDlFYGAnBQ3ieMWBNSV66HhC-8_F9DdFHzi_PvKq_pB_yjwj_ZwzjBVPmqappdKK3ignFn6DDn87TQMEuWkrX3xmiskWYRC2YmsjfCtirNFopxNj6K2T08IcIBF0UvkaPwB-J6LD0k_KpvmLe17CTIQ7Rap81FZAYGwN2-8r04vMP_ygtN-dMaLLi4A3HdUFsF1ADwPw4YrXxDA-Vz0wrCxyY=w1280',
  'https://sites.google.com/sitesv-images-rt/AMxu72sLa53katvWQ75KLSuE3D1RwSi-Mg39uefFzjuTDySKv3EV8IJGa4CXB11tqAbbl6Jc_d6GmRImWgyztvKXu6B5NJBt-sqqB2Y64rXA1WqAcLmhR5JKILn-hKlw_SxeaWReDHjcQl5KyAP5jC3AazFfu6kPWa9AOGGVl_-AifsOOCLW0VoSKkt0vwEjgF-g9QvX1ZdAdw8h8DGVczf8AtKXcA_BvMVcFi4qcDw4-0Q=w1280',
  'https://sites.google.com/sitesv-images-rt/AMxu72trWEO2YrL5t6zMZTsVkqg78BZ08sKNb7EsjVAHhKIEM8K50MJhYUr7qqKjqn6Fj0zWeVDgaIvP8P_Qo8vNKcnzm0zFMNIZ_LDyHdm3dlDurmJYuB7i6Yt_Nty-DWlrPOmdJmmdzhCRXHgfv7UtkH62H51VOgfNXivS2XxxXVSwdi6lMidR5vK5aTQXPhmjseosz64vbCshbTxCE1l2ukQo6TMw0bBYxIL6ysO9=w1280',
  'https://sites.google.com/sitesv-images-rt/AMxu72u4JEWl5jRLSBgfz2TQv-PUY4LcLvtwI1h5alL_pNrxaLTTskAvExr8uYbCONiaD3YFz6rxMfmG5DbmWfUhGFimEGtimdECk_UwF4mYRUCMX8ELidKHIRQVclBphxhhwTjf9TmyMQ8H15a3tJYB7vVmoo6Lnq9F8ypgrcqaQ9rWw7V87b04De4eBu9MHyJg1nC_ADmlsHmfBDyjmjrSXqICCFGKPYL09aGqLV_5PQ4=w1280',
  'https://sites.google.com/sitesv-images-rt/AMxu72vGwiO9y3EAElQEIeTRqAZGSAfd3HkWs1i2YVIo1Xfh0iZE8J0XOuHRnemQLHi6TtHkMRMq71UxGCLiUxq5g9pBq0xAm0IIM4PHEw_-K3f0qkBcNajFgm0oo8WBAFqO51qqTb2WTg_FCQ0P_XrUovqwV79B1iRyOVvI40nNBCBpJWV3IBKBaCf6u2mb5y-9z4278Zv3p4MalCtnFWRjTiAkdBkTyCqNMc73OIN8lKw=w1280',
  'https://sites.google.com/sitesv-images-rt/AMxu72u1FHFQL5DEUGKMHMbZuE3WM2N6OgWcoMsNUrnYTDZCN8QBc84N2LdpiiqZiMp8OkyTOof6wZ6mTWyt1CsdjajpbrN5BL68fbh381s9XM5GhxvvZKnvpziomCkVPl35CHTjvqOiXdZX-G_e59FgP8UlCR-m1KlP9F5tXm8OQgxirjzcoOAxAq0pMiMwDra4lbRCI2bniZdpTni7DWvLw48MmO9Qz05YbSm4ELGsWFo=w1280',
  'https://sites.google.com/sitesv-images-rt/AMxu72u8meSVH0uvvrgN7SXaVseMkX14nteS_pRLzrkUZCDgUFAW4Jup_WCAxIut0vw0Oc1QFCw_lOXEu5n_OLPL0V7flWxWorPQf6OjdWmx7iV7u0Rzh-VbIumtRqho4xfM1hog0WMDrMkTIwOuDcMG9QJ5rceEPPv0KwWs5lUQ5mz4HEcGj-WO-ewyAujAxps2SiPMa3l3onkgSYVkBjGZEF2v4PtoqsVqfGIMRuTmsuI=w1280',
  'https://sites.google.com/sitesv-images-rt/AMxu72tSTXGXsmn3KB9aCeihzrDzp527L5iCJv-grUrdGLU_IngRtWW3xO2aAMHSjxXMYBMVLRDec119PiCMuFsF7WRtLEwYSzAs92i5gOUIn5M_KBixbAhso2cXjG9Nk6QDMbHQ-HMw3ZMGZvZEEQsstjr0hu3XHsa1pbSkZ9C8DtrjyliaZyT12yn0I1dL26fEDqtMOpHRcbsTo2V9vx-uFlhLToNBfmlH6hCAnQTnoaM=w1280',
  'https://sites.google.com/sitesv-images-rt/AMxu72vvtlOXSzEcZUFb1XcoI8FjBmBPsn0kfe5EM-ziYuWHJPxkt9JN_TiVfTVPUeYp7Bu7Pz6HQq_Rv45QF81lKu4TeJn4o1dkZsfSLtsI3RalECvF_iBfePTUvDE1Nw-TuJi9mKSmV1UDGRWhwHX5Io1Xbr4lwLrUWLN8V6EbWkGIIZITNQML4pY724-HEHjQ5vBUg-iEVpbfOaNWaXiCafRcSSjhWRRKJc-5duYoto8=w1280',
  'https://sites.google.com/sitesv-images-rt/AMxu72uC7Fj__PXoD1XWLwCaYObdFGBtlKBPhbhJMonsLQ-JQit2BHCjrt_MfsC1qt4Cgcqmrgs-pY1XYffQmFG1KIstovpIuF1bXOIEEtnJXaJdogSVoUyrY3xNqu-psfgF4VngedY4LgJYbF0smMGTXSqS2Qeud6aEnTZ5FvBoYVxTVYCZZ9HxGjIr6GbTR0Gv1jbitYfBB9hRmq6Pwc7Rw2k1gJdOYq8J0giCylN0N28=w1280',
]

const names = [
  'guiso-fest',
  'rectora',
  'mateada-2025',
  'jornada-gastronomica',
  'inclusion-delantales',
  'cata-infusiones',
  'cata-vino',
  'mateada-2023',
  'organizacion-eventos',
  'tunel-artistas',
  'locos-asado',
  'muestra-gastronomica',
]

function download(url, file) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Referer: 'https://sites.google.com/bue.edu.ar/ifts-2-de-20/',
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          download(res.headers.location, file).then(resolve, reject)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} ${url.slice(0, 80)}`))
          return
        }
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const buf = Buffer.concat(chunks)
          fs.writeFileSync(file, buf)
          resolve({ file, bytes: buf.length })
        })
      },
    )
    req.on('error', reject)
  })
}

;(async () => {
  const map = {}
  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    const file = path.join(outDir, `${name}.jpg`)
    try {
      const r = await download(urls[i], file)
      console.log('OK', name, r.bytes)
      map[name] = `/events/${name}.jpg`
    } catch (e) {
      console.error('FAIL', name, e.message)
    }
  }
  fs.writeFileSync(path.join(outDir, 'map.json'), JSON.stringify(map, null, 2))
  console.log('done', Object.keys(map).length)
})()
