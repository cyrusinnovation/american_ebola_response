require 'Date'
require 'json'
require_relative 'country_data'
require_relative 'ebola_data'
require_relative 'outbreak_data'

CsvHeadings = Struct.new(:date, :country, :united_states) do
end

class EbolaDataParser
	attr_accessor :ebola_data, :country_map

	def initialize
		@ebola_data = EbolaData.new
		load_countries
	end

	def parse(dirs)
		files = get_files(dirs)		
		files.each { |file| parse_file(File.new(file, 'r')) }
		ebola_data
	end

	def write_country_mapping
		mapping = @country_map.inject({}) { |memo, (country, code)| memo[code] = country; memo }
		File.open("country_mapping.json","w") do |f|
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
		CsvHeadings.new(headings[0].chomp, headings[1], headings[2])
	end

	def parse_date(date_range)
		dates = date_range.split(' - ')
		dates[1]
	end

	def country_code(country_name)
		puts "Unknown country '#{country_name}'" unless @country_map[country_name]
		@country_map[country_name]
	end

	def parse_content(file, headings)
		dates = []
		data = []

		while(line = file.gets)
			fields = split_line(line)
			break unless fields.length > 1

			dates << parse_date(fields[0])
			if (fields.length == 3)
				data << [fields[1].to_f, fields[2].to_f]
			else
				data << [fields[1].to_f, fields[1].to_f]
			end
		end

		CountryData.new(country_code(headings.country.chomp), data, dates)
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
		file = File.new('CountryCodes.csv', 'r')
		@country_map = {}
		while (line = file.gets)
			fields = line.split(',')
			@country_map[fields[0]] = fields[3]
		end
	end
end

outbreak_data = OutbreakData.new

parser = EbolaDataParser.new
data = parser.parse(['data1', 'data2', 'data3', 'data4'])
data.write_csv(outbreak_data)
parser.write_country_mapping

outbreak_data.write_outbreak_json(parser.country_map)
