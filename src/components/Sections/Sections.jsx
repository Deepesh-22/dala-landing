import { SECTIONS } from '../../data/sections.js';
import Hero from '../Hero/Hero.jsx';
import Manifesto from './Manifesto.jsx';
import BulbSection from './BulbSection.jsx';
import Section from './Section.jsx';

const SKIP = new Set(['hero', 'manifesto', 'feature-01']);

export default function Sections() {
  return (
    <>
      <Hero />
      <Manifesto />
      <BulbSection />
      {SECTIONS.filter((s) => !SKIP.has(s.id)).map((s) => (
        <Section
          key={s.id}
          id={s.id}
          label={s.label}
          title={s.title}
          body={s.body}
        />
      ))}
    </>
  );
}
