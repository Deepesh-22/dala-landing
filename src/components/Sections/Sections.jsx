import { SECTIONS } from '../../data/sections.js';
import Hero from '../Hero/Hero.jsx';
import Section from './Section.jsx';

export default function Sections() {
  return (
    <>
      <Hero />
      {SECTIONS.filter((s) => s.id !== 'hero').map((s) => (
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
