import React, { useState, useEffect } from 'react';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';

interface Tone {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  voiceAttributes: string[];
  examples: string[];
  suitableFor: string[];
  colorScheme: string;
  isActive: boolean;
}

const ManageTonesPage: React.FC = () => {
  const [tones, setTones] = useState<Tone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setTones([
        {
          id: '1',
          name: 'Friendly Coach',
          description: 'Supportive mentor voice with warm, practical direction',
          characteristics: ['Actionable tips', 'Supportive prompts', 'Warm accountability'],
          voiceAttributes: ['Encouraging', 'Grounded', 'Practical'],
          examples: ['Session debrief guides', 'Trainer prep checklists', 'Coaching prompts'],
          suitableFor: ['Facilitators', 'Lead Trainers', 'Mentors'],
          colorScheme: 'green',
          isActive: true,
        },
        {
          id: '2',
          name: 'Casual Colleague',
          description: 'Down-to-earth teammate voice that keeps guidance real and relatable',
          characteristics: ['Conversational flow', 'Straight talk', 'Low-friction language'],
          voiceAttributes: ['Approachable', 'Candid', 'Relaxed'],
          examples: ['Quick-start guides', 'Slack/Teams updates', 'Trainer nudges'],
          suitableFor: ['Peer trainers', 'Content creators', 'Session hosts'],
          colorScheme: 'blue',
          isActive: true,
        },
        {
          id: '3',
          name: 'Energetic Friend',
          description: 'Upbeat motivator who keeps energy high without the hype',
          characteristics: ['Momentum building', 'Positive reinforcement', 'Punchy sentences'],
          voiceAttributes: ['Upbeat', 'Motivating', 'Bright'],
          examples: ['Session openers', 'Marketing teasers', 'Hype moments'],
          suitableFor: ['Launch events', 'High-energy workshops', 'Promotional assets'],
          colorScheme: 'orange',
          isActive: true,
        },
        {
          id: '4',
          name: 'Storytelling Buddy',
          description: 'Narrative guide who connects ideas to lived experiences',
          characteristics: ['Anecdotal hooks', 'Reflective prompts', 'Contextual cues'],
          voiceAttributes: ['Empathetic', 'Curious', 'Grounded'],
          examples: ['Case study intros', 'Segment transitions', 'Follow-up recaps'],
          suitableFor: ['Story-driven sessions', 'Content recaps', 'Testimonial moments'],
          colorScheme: 'purple',
          isActive: true,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTones = tones.filter(tone =>
    tone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tone.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColorClasses = (colorScheme: string, isActive: boolean = true) => {
    const opacity = isActive ? '100' : '50';
    switch (colorScheme) {
      case 'blue':
        return `bg-blue-${opacity} text-blue-700 border-blue-200`;
      case 'green':
        return `bg-green-${opacity} text-green-700 border-green-200`;
      case 'purple':
        return `bg-purple-${opacity} text-purple-700 border-purple-200`;
      case 'orange':
        return `bg-orange-${opacity} text-orange-700 border-orange-200`;
      case 'slate':
        return `bg-slate-${opacity} text-slate-700 border-slate-200`;
      default:
        return `bg-gray-${opacity} text-gray-700 border-gray-200`;
    }
  };

  return (
    <BuilderLayout
      title="Manage Tones"
      subtitle="Content voice and communication styles"
      statusSlot={<Button>🎨 Add Tone</Button>}
    >
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search tones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTones.map((tone) => (
              <Card key={tone.id} className={!tone.isActive ? 'opacity-75' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{tone.name}</h3>
                        <div className={`w-3 h-3 rounded-full ${
                          tone.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <p className="text-sm text-slate-600">{tone.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Characteristics</h4>
                      <div className="flex flex-wrap gap-2">
                        {tone.characteristics.map((char, index) => (
                          <span key={index} className={`px-2 py-1 text-xs rounded-full border ${getColorClasses(tone.colorScheme, tone.isActive)}`}>
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Voice Attributes</h4>
                      <div className="flex flex-wrap gap-2">
                        {tone.voiceAttributes.map((attr, index) => (
                          <span key={index} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                            {attr}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Best For</h4>
                      <p className="text-sm text-slate-600">{tone.suitableFor.join(', ')}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Example Use Cases</h4>
                      <ul className="text-sm text-slate-600">
                        {tone.examples.slice(0, 2).map((example, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                            {example}
                          </li>
                        ))}
                        {tone.examples.length > 2 && (
                          <li className="text-slate-500 text-xs">+{tone.examples.length - 2} more examples</li>
                        )}\n                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                    <Button variant="outline" size="sm">Edit</Button>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-slate-500">
                        Preview
                      </Button>
                      <Button
                        variant={tone.isActive ? "destructive" : "default"}
                        size="sm"
                      >
                        {tone.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </BuilderLayout>
  );
};

export default ManageTonesPage;
