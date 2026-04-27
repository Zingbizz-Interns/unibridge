import HomeNav from '@/components/home/HomeNav'
import HeroSection from '@/components/home/HeroSection'
import StatsBar from '@/components/home/StatsBar'
import StudyGoalSection from '@/components/home/StudyGoalSection'
import ExploreProgramsSection from '@/components/home/ExploreProgramsSection'
import TopStudyPlaces from '@/components/home/TopStudyPlaces'
import ExploreCoursesSection from '@/components/home/ExploreCoursesSection'
import HomeFooter from '@/components/home/HomeFooter'
import { getCurrentUser } from '@/lib/session'

export default async function Home() {
  const user = await getCurrentUser()
  return (
    <main className="min-h-screen bg-md-surface">
      <HomeNav userName={user?.name ?? undefined} userRole={user?.role ?? undefined} />
      <HeroSection />
      <StatsBar />
      <StudyGoalSection />
      <ExploreProgramsSection />
      <TopStudyPlaces />
      <ExploreCoursesSection />
      <HomeFooter />
    </main>
  )
}
