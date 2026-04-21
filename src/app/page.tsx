import HomeNav from '@/components/home/HomeNav'
import HeroSection from '@/components/home/HeroSection'
import StatsBar from '@/components/home/StatsBar'
import StudyGoalSection from '@/components/home/StudyGoalSection'
import ExploreProgramsSection from '@/components/home/ExploreProgramsSection'
import TopStudyPlaces from '@/components/home/TopStudyPlaces'
import ExploreCoursesSection from '@/components/home/ExploreCoursesSection'
import HomeFooter from '@/components/home/HomeFooter'

export default function Home() {
  return (
    <main className="min-h-screen bg-md-surface">
      <HomeNav />
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
