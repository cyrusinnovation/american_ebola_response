require 'Date'
require 'json'
require_relative 'country_data'
require_relative 'ebola_data'
require_relative 'outbreak_data'
require_relative 'news_data'
require_relative 'line_chart_data'

CsvHeadings = Struct.new(:date, :country, :united_states) do
	def country_index
		country == 'United States' ? 2 : 1
	end

	def us_index
		country == 'United States' ? 1 : 2
	end

	def correct_us_and_country
		if (country == 'United States')
			return CsvHeadings.new(date, united_states, country)
		end

		return self
	end
end

class EbolaDataParser
	attr_accessor :ebola_data, :country_map

	def initialize
		@ebola_data = EbolaData.new
		load_countries
	end

	def parse(dirs)
		files = get_files(dirs)		
		files.each do |file| 
			@current_file = file
			parse_file(File.new(file, 'r'))
		end

		ebola_data.normalize_data
		parse_line_chart_data
		ebola_data
	end

	def write_country_mapping
		mapping = @country_map.inject({}) { |memo, (country, code)| memo[code] = country; memo }
		File.open("outputs/country_mapping.json","w") do |f|
  			f.write({ 'countries' => mapping }.to_json)
		end
	end

	private

	def split_line(line)
		line.split(',')
	end

	def parse_header(file)
		header = file.gets
		countries = file.gets
		time_period = file.gets

		unused = [file.gets, file.gets] #empty
		headings = split_line(file.gets)
		CsvHeadings.new(headings[0].chomp, headings[1], headings[1]) unless headings.size == 3		
		headings = CsvHeadings.new(headings[0].chomp, headings[1], headings[2])
	end

	def parse_date(date_range)
		dates = date_range.split(' - ')
		dates[1] if dates.length > 1
		dates[0]
	end

	def country_code(country_name)
		puts "Unknown country '#{country_name}' when parsing #{@current_file}" unless @country_map[country_name]
		@country_map[country_name]
	end

	def parse_content(file, headings)
		dates = []
		data = []

		while(line = file.gets)
			fields = split_line(line)
			break unless fields.length > 1
			next if fields[1].include? ' '

			dates << parse_date(fields[0])
			if (fields.length == 3)
				data << [fields[headings.country_index], fields[headings.us_index]]
			else
				data << [fields[1], fields[1]]
			end
		end

		headings = headings.correct_us_and_country
		CountryData.new(country_code(headings.country.chomp), data, dates, headings.country.chomp)
	end

	def parse_file(file)
		headings = parse_header(file)
		return nil unless headings

		country_data = parse_content(file, headings)
		ebola_data.add_country(country_data)
	end

	def get_files(dirs)
		files = []
		dirs.each do |dir|
			select_files = Dir.entries(dir).select { |file| file.include?('.csv') }
			files += select_files.map { |file| dir + '/' + file }
		end
		files
	end

	def load_countries
		file = File.new('inputs/CountryCodes.csv', 'r')
		@country_map = {}
		while (line = file.gets)
			fields = line.split(',')
			@country_map[fields[0]] = fields[3]
		end
	end

	def country_data(human_name)
		@ebola_data.country_data_for(country_code(human_name))
	end

	def parse_line_chart_data
		@places_of_interest = [
			{ title: 'Brazil', places: ['Brazil'] },
			{ title: 'Chile',  places: ['Chile'] },
			{ title: 'Panama',  places: ['Panama'] },
			{ title: 'Belize',  places: ['Belize'] },
			{ title: 'Zimbabwe',  places: ['Zimbabwe'] },
			{ title: 'Jamaica',  places: ['Jamaica'] },
			{ title: 'Mozambique',  places: ['Mozambique'] },
			{ title: 'Guyana',  places: ['Guyana'] },
			{ title: 'Paraguay',  places: ['Paraguay'] },
			{ title: 'Norway',  places: ['Norway'] },
			{ title: 'Australia',  places: ['Australia'] },
			{ title: 'Sweden',  places: ['Sweden'] },
			{ title: 'Cuba',  places: ['Cuba'] },
			{ title: 'Haiti', places: ['Haiti'] },
		]

		@places_of_interest.each do |place|
			write_place_line_chart(place)
		end
	end

	def write_place_line_chart(place)
		chart_data = LineChartData.new(ebola_data.ninety_day_dates, place[:title])
		place[:places].each do |place_name|
			chart_data.add_country(country_data(place_name))
		end

		chart_data.write_csv
	end
end

parser = EbolaDataParser.new
news_data = NewsData.new
outbreak_data = OutbreakData.new(news_data, parser.country_map)

data = parser.parse(['data1', 'data2', 'data3', 'data4', '90_day_1', '90_day_2', '90_day_3'])
data.write_csv(outbreak_data)
parser.write_country_mapping

outbreak_data.write_outbreak_json
