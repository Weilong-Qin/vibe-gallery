import React from 'react'
import galleryData from './data/gallery.json'
import type { GalleryData } from '../types/index.js'
import { Layout } from './components/Layout.js'
import { Profile, Skills, Experience, Education } from './components/resume/index.js'
import { ProjectGrid } from './components/projects/index.js'
import { LangContext } from './i18n.js'

const data = galleryData as unknown as GalleryData

export default function App() {
  const { profile, resume, projects, theme, accent, layout, language } = data

  const resumeSections =
    resume.sections && resume.sections.length > 0
      ? resume.sections
      : (['skills', 'experience', 'education', 'projects'] as const)

  const sectionComponents: Record<string, React.ReactNode> = {
    skills: resume.skills?.length ? <Skills key="skills" skills={resume.skills} /> : null,
    experience: resume.experience?.length ? <Experience key="experience" experience={resume.experience} /> : null,
    education: resume.education?.length ? <Education key="education" education={resume.education} /> : null,
    projects: <ProjectGrid key="projects" projects={projects} />,
  }

  const isSidebar = layout.page === 'sidebar'

  return (
    <LangContext.Provider value={language ?? 'en'}>
    <Layout layout={layout} theme={theme} accent={accent}>
      {isSidebar ? (
        <div className="page-root">
          <aside style={{ position: 'sticky', top: 'var(--space-xl)', alignSelf: 'start' }}>
            <Profile profile={profile} />
            {resumeSections
              .filter((s) => s !== 'projects')
              .map((s) => sectionComponents[s])
              .filter(Boolean)}
          </aside>
          <main>{sectionComponents['projects']}</main>
        </div>
      ) : layout.page === 'hero' ? (
        <>
          <div className="hero-section">
            <Profile profile={profile} />
          </div>
          <div className="content-section">
            <div className="page-root">
              {resumeSections
                .filter((s) => s !== 'projects')
                .map((s) => sectionComponents[s])
                .filter(Boolean)}
              {sectionComponents['projects']}
            </div>
          </div>
        </>
      ) : (
        <div className="page-root">
          <Profile profile={profile} />
          {resumeSections.map((s) => sectionComponents[s]).filter(Boolean)}
        </div>
      )}
    </Layout>
    </LangContext.Provider>
  )
}
