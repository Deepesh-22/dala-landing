import { SECTIONS } from '../../data/sections.js';
import Hero from '../Hero/Hero.jsx';
import Manifesto from './Manifesto.jsx';
import Section from './Section.jsx';

export default function Sections() {
  return (
    <>
      <Hero />
      <Manifesto />
      {SECTIONS.filter((s) => s.id !== 'hero' && s.id !== 'manifesto').map(
        (s) => (
          <Section
            key={s.id}
            id={s.id}
            label={s.label}
            title={s.title}
            body={s.body}
          />
        )
      )}
    </>
  );
}
