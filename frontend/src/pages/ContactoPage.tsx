import { institute } from '../data/site'
import {
  mapsEmbedUrl,
  mapsOpenUrl,
  useInstituteContact,
} from '../data/instituteStore'
import { SocialIcons } from '../components/SocialIcons'

export function ContactoPage() {
  const { contact } = useInstituteContact()
  const mapSrc = mapsEmbedUrl(contact.mapQuery || contact.address)

  return (
    <div className="page">
      <div className="container stack">
        <div>
          <p className="page-kicker">Contacto</p>
          <h1 className="page-title">¿Dónde estamos?</h1>
          <p className="page-lead">
            Datos de contacto del {institute.name}.
          </p>
        </div>

        <div className="contact-bento">
            <section className="contact-bento__card contact-bento__card--sede">
              <h2>Sede</h2>
              <p className="contact-bento__address">
                <strong>{contact.address}</strong>
              </p>
              <ul className="contact-bento__list">
                <li>
                  Tel:{' '}
                  <a href={`tel:${contact.phone.replace(/\D/g, '')}`}>
                    <strong>{contact.phone}</strong>
                  </a>
                </li>
                <li>
                  Mail:{' '}
                  <a href={`mailto:${contact.email}`}>
                    <strong>{contact.email}</strong>
                  </a>
                </li>
                {contact.officialSite && (
                  <li>
                    <a
                      href={contact.officialSite}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Sitio oficial →
                    </a>
                  </li>
                )}
              </ul>
            </section>

            <section className="contact-bento__card contact-bento__card--redes">
              <h2>Redes</h2>
              <SocialIcons variant="panel" className="contact-bento__social" />
            </section>

            <section className="contact-bento__card contact-bento__card--bedelia">
              <h2>Consultar a bedelía</h2>
              <p className="muted" style={{ marginBottom: 0 }}>
                Usá el botón flotante abajo a la derecha: abre tu correo hacia
                bedelía con el mensaje listo.
              </p>
            </section>

            {mapSrc && (
              <section className="contact-bento__card contact-bento__card--mapa">
                <div className="map-block__head">
                  <h2 className="map-block__title">Ubicación</h2>
                  <a
                    className="link-row"
                    href={mapsOpenUrl(contact.mapQuery || contact.address)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir en Maps →
                  </a>
                </div>
                <iframe
                  className="map-block__frame"
                  title={`Mapa: ${contact.address}`}
                  src={mapSrc}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </section>
            )}
          </div>
      </div>
    </div>
  )
}
