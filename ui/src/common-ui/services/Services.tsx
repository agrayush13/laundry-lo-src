import React from 'react';
import { SERVICES_SECTION } from '../../config/homeConfig';
import { SERVICE_TYPES, formatPrice } from '../../data/services';
import Card from '../card/Card';
import SectionHead from '../section-head/SectionHead';
import styles from './services.module.scss';

const Services: React.FC = () => (
    <section
        className="section"
        id={SERVICES_SECTION.id}
    >
        <div className="container">
            <SectionHead
                title={SERVICES_SECTION.title}
                subtitle={SERVICES_SECTION.subtitle}
            />

            <ul className={styles.services}>
                {SERVICE_TYPES.map((service) => (
                    <Card
                        as="li"
                        className={styles.servicesItem}
                        key={service.id}
                    >
                        <img
                            className={styles.servicesImage}
                            src={service.image.url}
                            alt={service.image.alt}
                            loading="lazy"
                        />
                        <div className={styles.servicesBody}>
                            <h3 className={styles.servicesName}>{service.name}</h3>
                            <p className={styles.servicesDescription}>{service.longDescription}</p>
                            <p className={styles.servicesPrice}>
                                {SERVICES_SECTION.pricePrefix} {formatPrice(service)}
                            </p>
                        </div>
                    </Card>
                ))}
            </ul>
        </div>
    </section>
);

export default Services;
