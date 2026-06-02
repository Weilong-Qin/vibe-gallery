import React, { useEffect, useState } from 'react'
import type { GalleryData } from '../types/index.js'
import { Layout } from './components/Layout.js'
import { Profile, Skills, Experience, Education } from './components/resume/index.js'
import { ProjectGrid } from './components/projects/index.js'
import { LangContext } from './i18n.js'
import { defaultGalleryData } from './data/defaultGalleryData.js'

const galleryDataUrl = `${import.meta.env.BASE_URL}gallery.json`

export default function App() {
  const [data, setData] = useState<GalleryData>(defaultGalleryData)

  useEffect(() => {
    let active = true

    fetch(galleryDataUrl)
      .then((response) => (response.ok ? response.json() : defaultGalleryData))
      .then((nextData: GalleryData) => {
        if (active) setData(nextData)
      })
      .catch(() => {
        if (active) setData(defaultGalleryData)
      })

    return () => {
      active = false
    }
  }, [])

  const { profile, resume, projects, theme, accent, layout, language, sort } = data

  const resumeSections = resume.sections && resume.sections.length > 0
    ? resume.sections
    : (['skills', 'experience', 'education', 'projects'] as const)

  const sectionComponents: Record<string, React.ReactNode> = {
    skills: resume.skills?.length ? <Skills key="skills" skills={resume.skills} /> : null,
    experience: resume.experience?.length ? <Experience key="experience" experience={resume.experience} /> : null,
    education: resume.education?.length ? <Education key="education" education={resume.education} /> : null,
    projects: <ProjectGrid key="projects" projects={projects} sort={sort} />,
  }

  const isSidebar = layout.page === 'sidebar'
  const isWide = layout.page === 'wide'

  return (
    <LangContext.Provider value={language ?? 'en'}>
      <Layout layout={layout} theme={theme} accent={accent}>
        {isSidebar ? (
          <div className="page-root">
            <aside>
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
        ) : isWide ? (
          <div className="page-root">
            <div className="wide-header">
              <aside>
                <Profile profile={profile} />
              </aside>
              <div className="wide-header__bio">
                {resumeSections
                  .filter((s) => s !== 'projects')
                  .map((s) => sectionComponents[s])
                  .filter(Boolean)}
              </div>
            </div>
            <main>{sectionComponents['projects']}</main>
          </div>
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
