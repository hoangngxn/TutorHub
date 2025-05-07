import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faHandshake, faChartLine } from '@fortawesome/free-solid-svg-icons';

export default function AboutPage() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            About TutorHub
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            We're on a mission to make quality education accessible to everyone through personalized tutoring.
          </p>
        </div>

        {/* Mission section */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="relative">
              <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                <FontAwesomeIcon icon={faLightbulb} className="h-6 w-6" />
              </div>
              <div className="ml-16">
                <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
                <p className="mt-4 text-lg text-gray-500">
                  At TutorHub, we believe that every student deserves access to quality education. Our platform connects
                  students with qualified tutors who can provide personalized learning experiences tailored to individual
                  needs and goals.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                <FontAwesomeIcon icon={faHandshake} className="h-6 w-6" />
              </div>
              <div className="ml-16">
                <h2 className="text-2xl font-bold text-gray-900">Our Values</h2>
                <p className="mt-4 text-lg text-gray-500">
                  We are committed to fostering a community of learning where knowledge is shared freely and effectively.
                  Our values of excellence, integrity, and innovation guide everything we do.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team section */}
        <div className="mt-20">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center">Our Team</h2>
          <p className="mt-4 text-lg text-gray-500 text-center max-w-3xl mx-auto">
            We are a diverse team of educators, technologists, and entrepreneurs passionate about transforming education
            through technology.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="h-32 w-32 rounded-full overflow-hidden mx-auto">
                <img
                  className="h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Team member"
                />
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Sarah Johnson</h3>
              <p className="text-sm text-gray-500">Founder & CEO</p>
            </div>

            <div className="text-center">
              <div className="h-32 w-32 rounded-full overflow-hidden mx-auto">
                <img
                  className="h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Team member"
                />
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Michael Chen</h3>
              <p className="text-sm text-gray-500">Head of Technology</p>
            </div>

            <div className="text-center">
              <div className="h-32 w-32 rounded-full overflow-hidden mx-auto">
                <img
                  className="h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Team member"
                />
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Emily Rodriguez</h3>
              <p className="text-sm text-gray-500">Education Director</p>
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div className="mt-20">
          <div className="relative">
            <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
              <FontAwesomeIcon icon={faChartLine} className="h-6 w-6" />
            </div>
            <div className="ml-16">
              <h2 className="text-2xl font-bold text-gray-900">Our Impact</h2>
              <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-indigo-600">10,000+</p>
                  <p className="mt-2 text-lg text-gray-500">Active Students</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-indigo-600">2,000+</p>
                  <p className="mt-2 text-lg text-gray-500">Qualified Tutors</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-indigo-600">50,000+</p>
                  <p className="mt-2 text-lg text-gray-500">Hours of Tutoring</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 